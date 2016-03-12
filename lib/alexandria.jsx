import forms from "newforms"
import BootstrapForm from "newforms-bootstrap"
import React from "react"
import {Button, ButtonToolbar} from "react-bootstrap"
import {composeWithTracker} from "react-komposer"
import {Link, browserHistory} from "react-router"
import toastr from "toastr"

if(Meteor.isServer) {
  JsZip = require("jszip")
  convert = require("ebook-convert")
  fs = require("fs")
  parseString = require("xml2js").parseString
  temp = require("temp")
  temp.track()
}

const upload = new FS.Store.GridFS("upload")

const htmlz = new FS.Store.GridFS("htmlz", {
  beforeWrite: (fileObj) => ({
    extension: "htmlz",
    type: "application/zip"
  }),
  transformWrite: (fileObj, readStream, writeStream) => {
    console.log("Here1")
    const tempDir = temp.mkdirSync()
    console.log("Here2", tempDir)
    const upload = fs.createWriteStream(tempDir+"/"+fileObj.name())
    console.log("Here3", upload.path)
    readStream.pipe(upload)
    const baseName = upload.path
    const htmlzName = baseName+".htmlz"
    console.log("Here4", htmlzName)
    const htmlz = convert({
      source: baseName,
      target: htmlzName
    })
    console.log("Here5")
    htmlz.on("data", console.log)
    htmlz.on("error", (err) => console.log(err))
    htmlz.on("message", (msg) => console.log(msg.toString()))
    htmlz.on("exit", Meteor.bindEnvironment((code) => {
      console.log("Here6", code)
      if(code == 0) {
        const target = fs.createReadStream(htmlzName)
        target.pipe(writeStream)
        fs.unlinkSync(baseName)
        const zip = new JsZip(fs.readFileSync(htmlzName))
        const metadata = zip.file("metadata.opf").asText()
        parseString(metadata, {explicitArray: false, mergeAttrs: true, charkey: "char"}, (err, result) => {
          fileObj.update({metadata: result.package.metadata})
        })
        fs.unlinkSync(htmlzName)
        fileObj.update({formatVersion: 0})
      }
    }))
  }
})

Books = new FS.Collection("books", {stores: [upload, htmlz]})

export {Books}

const title = (book) => {
  if(book.metadata && book.metadata["dc:title"])
    return book.metadata["dc:title"]
  else
    return book.name()
}

const author = (book) => {
  if(book.metadata && book.metadata["dc:creator"] && book.metadata["dc:creator"].char)
    return book.metadata["dc:creator"].char
}

export const BookListUI = ({books, remove}) => <div>
  <h1>Books</h1>
  <Link to="/new">New</Link>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Author</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {books.map((b) => <tr>
        <td><Link to={`/books/${b._id}`}>{title(b)}</Link></td>
        <td>{author(b)}</td>
        <td><Button onClick={remove(b._id)}>Remove</Button></td>
      </tr>)}
    </tbody>
  </table>
</div>

const BookListContainer = (props, onData) => {
  if(Meteor.subscribe("books").ready())
    onData(null, {
      books: Books.find({}, {sort: {"original.name": 1}}).fetch(),
      remove: (id) => (() => Books.remove(id))
    })
}

export const BookList = composeWithTracker(BookListContainer)(BookListUI)

const UploadUI = React.createClass({

  form: forms.Form.extend({
    file: forms.FileField({widgetAttrs: {autoFocus: true}})
  }),

  onSubmit(e) {
    e.preventDefault()
    const form = this.refs.form.getForm()
    if(form.validate())
      this.props.onSubmit(form.cleanedData)
  },

  componentDidUpdate(prevProps) {
    if(!prevProps.file && this.props.file) {
      const file = this.props.file
      const self = this
      file.on("progress", () => {
        console.log("Progress!")
      })
      file.on("uploaded", () => browserHistory.push(`/books/${file._id}`))
    }
  },

  render() {
    if(this.props.file)
      return <div>
        <h1>Uploading</h1>
      </div>
    else
      return <div>
        <h1>Upload Book</h1>
        <form onSubmit={this.onSubmit}>
          <forms.RenderForm ref="form" form={this.form}>
            <BootstrapForm/>
          </forms.RenderForm>
          <Button type="submit">Upload</Button>
        </form>
      </div>
  }

})

const UploadContainer = (props, onData) => {
  onData(null, {
    onSubmit: (args) => {
      Books.insert(args.file, (err, fileObj) => {
        if(err) {
          console.log(err)
          toastr.error(err)
        } else
          onData(null, {file: fileObj})
      })
    }
  })
}

export const Upload = composeWithTracker(UploadContainer)(UploadUI)

const BookDisplayUI = ({id}) => <div>
  <ButtonToolbar>
    <Link to="/">Home</Link>
  </ButtonToolbar>
  <iframe src={`/files/${id}/index.html`}/>
</div>

const BookDisplayContainer = (props, onData) => {
  if(Meteor.subscribe("books").ready())
    onData(null, {
      id: props.params.id
    })
}

export const BookDisplay = composeWithTracker(BookDisplayContainer)(BookDisplayUI)
