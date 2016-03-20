JSZip = require("jszip")
mime = require("mime")

Books = require("/lib/alexandria.jsx").Books

Books.allow
  insert: ->
    if @connection?.sandstormUser()?.permissions.indexOf("modify") != -1
      true
    else
      false
  update: ->
    if @connection?.sandstormUser()?.permissions.indexOf("modify") != -1
      true
    else
      false
  remove: ->
    if @connection?.sandstormUser()?.permissions.indexOf("modify") != -1
      true
    else
      false

Meteor.publish "books", ->
  Books.find({}, {fields: {"original.name": 1, metadata: 1}})

Picker.route "/files/:id", (params, req, res) ->
  if @connection?.sandstormUser()?.permissions?.indexOf("download") == -1
    res.statusCode = 403
    return res.end()
  book = Books.findOne(params.id)
  if book?
    while !book.hasStored("upload")
      continue
    stream = book.createReadStream("upload")
    res.setHeader("Content-Type", mime.lookup(book.original.name))
    res.setHeader("Content-Disposition", "inline; filename="+encodeURI(book.original.name))
    stream.pipe(res)
  else
    res.statusCode = 404
    res.end()

Picker.route "/files/:id/:filename+", (params, req, res) ->
  book = Books.findOne(params.id)
  if book?
    while !book.hasStored("htmlz")
      continue
    stream = book.createReadStream("htmlz")
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
