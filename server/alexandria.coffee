Future = Npm.require("fibers/future")
JSZip = require("jszip")
mime = require("mime")

Books = require("/lib/alexandria.jsx").Books

Books.allow
  insert: -> true
  update: -> true
  remove: -> true

Meteor.publish "books", ->
  Books.find({}, {fields: {"original.name": 1, metadata: 1}})

HTTP.methods
  "/files/:id/:filename": ->
    book = Books.findOne(@params.id)
    if book?
      while !book.hasStored("htmlz")
        continue
      future = new Future()
      stream = book.createReadStream("htmlz")
      buffer = new Buffer(0)
      filename = @params.filename
      self = @
      stream.on "data", (data) ->
        buffer = Buffer.concat([buffer, data])
      stream.on "end", ->
        zip = new JSZip(buffer)
        file = zip.file(filename)
        contentType = mime.lookup(file.name)
        data = if contentType.startsWith("text")
          file.asText()
        else
          file.asBinary()
        self.setContentType(contentType)
        future.return(data)
      future.wait()
    else
      @setStatusCode(404)
