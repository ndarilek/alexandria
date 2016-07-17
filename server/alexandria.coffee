Future = Npm.require("fibers/future")
JSZip = require("jszip")
exec = require("child_process").exec
fs = require("fs")
mime = require("mime")
parseString = require("xml2js").parseString
temp = require("temp")

temp.track()

Bookmarks = require("/lib/collections").Bookmarks
Books = require("/lib/collections").Books
Uploads = require("/lib/collections").Uploads

# TODO: Fix me
Uploads.allow
  insert: ->
    true
  read: ->
    true
  write: ->
    true
  remove: ->
    false

Htmlz = new FileCollection("htmlz")

Books.find().observe
  removed: (doc) ->
    Bookmarks.remove({bookId: doc._id})
    Uploads.remove(new Mongo.ObjectID(doc?.files?.uploadId))
    Htmlz.remove(new Mongo.ObjectID(doc?.files?.htmlzId))

Meteor.publish "books", ->
  Books.find({})

Picker.route "/files/:id", (params, req, res) ->
  if @connection?.sandstormUser()?.permissions?.indexOf("download") == -1
    res.statusCode = 403
    return res.end()
  book = Books.findOne(params.id)
  if book?
    upload = Uploads.findOne(new Mongo.ObjectID(book.files?.uploadId))
    stream = Uploads.findOneStream(new Mongo.ObjectID(book.files?.uploadId))
    res.setHeader("Content-Type", mime.lookup(upload.filename))
    res.setHeader("Content-Disposition", "inline; filename="+encodeURI(upload.filename))
    stream.pipe(res)
  else
    res.statusCode = 404
    res.end()

Picker.route "/files/:id/:filename+", (params, req, res) ->
  book = Books.findOne(params.id)
  if book?
    stream = Htmlz.findOneStream(new Mongo.ObjectID(book.files?.htmlzId))
    buffer = new Buffer(0)
    filename = params.filename
    self = @
    stream.on "data", (data) ->
      buffer = Buffer.concat([buffer, data])
    stream.on "end", ->
      zip = new JSZip(buffer)
      file = zip.file(filename)
      if file?
        contentType = mime.lookup(file.name)
        data = if contentType.startsWith("text")
          file.asText()
        else
          file.asBinary()
        res.setHeader("Content-Type", contentType)
        res.end(data)
      else
        res.statusCode = 404
        res.end()
  else
    res.statusCode = 404
    res.end()

Meteor.methods

  "books.editMetadata": (id, args) ->
    console.log("Called")
    check id, String
    check args,
      title: Match.Optional(String)
      author: Match.Optional(String)
    if @connection?.sandstormUser()?.permissions?.indexOf("modify") != -1
      book = Books.findOne(id)
      if book?
        Books.update(id, {$set: {"metadata.user": args}})
      else
        throw new Meteor.Error(404, "Not found")
    else
      throw new Meteor.Error(403, "Unauthorized")

  "books.remove": (id) ->
    check id, String
    if @connection?.sandstormUser()?.permissions?.indexOf("modify") != -1
      Books.remove(id)
    else
      throw new Meteor.Error(403, "Unauthorized")

Meteor.methods
  "books.create": (id) ->
    doc = Uploads.findOne(new Mongo.ObjectID(id))
    tempDir = temp.mkdirSync()
    baseName = tempDir+"/"+doc.filename
    future = new Future()
    Uploads.exportFile doc._id, baseName, (err, upload) ->
      if err?
        console.error(err)
        future.throw(err)
      else
        htmlzName = baseName+".htmlz"
        exec 'ebook-convert "'+baseName+'" "'+htmlzName+'"', Meteor.bindEnvironment((err, stdout, stderr) ->
          if stdout?
            console.log(stdout.toString())
          if stderr? and stderr.toString().length
            console.error(stderr.toString())
          if err?
            console.error("Error: ",err)
            future.throw(err)
          else
            if fs.existsSync(baseName)
              fs.unlinkSync(baseName)
            bookId = Books.insert({files: {uploadId: id, uploadFilename: doc.filename}, formatVersion: 0})
            Htmlz.importFile htmlzName, {contentType: mime.lookup(htmlzName)}, (err, file) ->
              if err?
                console.error(err)
                future.throw(err)
              else
                Books.update(bookId, {$set: {"files.htmlzId": file._id.toHexString()}})
                zip = new JSZip(fs.readFileSync(htmlzName))
                metadata = zip.file("metadata.opf").asText()
                parseString metadata, {explicitArray: false, mergeAttrs: true, charkey: "char"}, (err, result) ->
                  if err?
                    console.error(err)
                  else
                    Books.update(bookId, {$set: {"metadata.original": result.package.metadata}})
                  if fs.existsSync(htmlzName)
                    fs.unlinkSync(htmlzName)
                  future.return(bookId)
        )
    future.wait()

Meteor.publish "bookmarks", (bookId) ->
  check bookId, String
  Bookmarks.find({userId: @userId, bookId: bookId})

Meteor.methods

  "bookmarks.create": (bookId, name, data) ->
    check bookId, String
    check name, Match.Maybe(String)
    check data, Match.Maybe(Object)
    userId = Meteor.userId()
    if userId?
      book = Books.findOne(bookId)
      if book?
        name = "" unless name?
        if Bookmarks.findOne({userId: userId, bookId: bookId, name: name})?
          throw new Meteor.Error("Bookmark already exists")
        else
          unless data?
            data =
              backward: false
              rangeBookmarks: [
                start: 0
                end: 0
                containerNode: {}
              ]
          Bookmarks.insert({userId: userId, bookId: bookId, name: name, data: data})
      else
        throw new Meteor.Error(404, "Book not found")
    else
      throw new Meteor.Error(403, "Unauthorized")

  "bookmarks.update": (bookmarkId, data) ->
    check bookmarkId, String
    check data, Object
    userId = Meteor.userId()
    if userId?
      Bookmarks.update({_id: bookmarkId, userId: userId}, {$set: {data: data, sessionId: @connection.id}})
    else
      throw new Meteor.Error(403, "Unauthorized")

  "bookmarks.remove": (bookmarkId) ->
    check bookmarkId, String
    userId = Meteor.userId()
    if userId?
      Bookmarks.remove({userId: Meteor.userId(), bookmarkId: bookmarkId})
    else
      throw new Meteor.Error(403, "Unauthorized")
