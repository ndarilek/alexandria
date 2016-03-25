Future = Npm.require("fibers/future")
JSZip = require("jszip")
exec = require("child_process").exec
fs = require("fs")
mime = require("mime")
parseString = require("xml2js").parseString
temp = require("temp")

temp.track()

Books = require("/lib/alexandria").Books
Uploads = require("/lib/alexandria").Uploads

# TODO: Fix me
Uploads.allow
  insert: ->
    @connection?.sandstormUser()?.permissions?.indexOf("modify") != -1
  read: ->
    true
  write: ->
    true
  remove: ->
    @connection?.sandstormUser()?.permissions?.indexOf("modify") != -1

Htmlz = new FileCollection("htmlz")

Books.find().observe
  removed: (doc) ->
    Uploads.remove(doc?.files?.uploadId?)
    Htmlz.remove(doc?.files?.htmlzId?)

Meteor.publish "books", ->
  Books.find({})

Picker.route "/files/:id", (params, req, res) ->
  if @connection?.sandstormUser()?.permissions?.indexOf("download") == -1
    res.statusCode = 403
    return res.end()
  book = Books.findOne(params.id)
  if book?
    upload = Uploads.findOne(new Mongo.ObjectID(book.files?.uploadId?))
    stream = Uploads.findOneStream(book.files?.uploadId?)
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
