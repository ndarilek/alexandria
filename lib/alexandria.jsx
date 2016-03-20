import forms from "newforms"
import BootstrapForm from "newforms-bootstrap"
import React from "react"
import {Button, Nav, Navbar, NavItem} from "react-bootstrap"
import Helmet from "react-helmet"
import {composeWithTracker} from "react-komposer"
import {Link, browserHistory} from "react-router"
import {LinkContainer} from "react-router-bootstrap"
import toastr from "toastr"

import {hasPermission} from "./sandstorm"

if(Meteor.isServer) {
  JsZip = require("jszip")
  exec = require("child_process").exec
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
    const tempDir = temp.mkdirSync()
    const upload = fs.createWriteStream(tempDir+"/"+fileObj.name())
    readStream.pipe(upload)
    const baseName = upload.path
    const htmlzName = baseName+".htmlz"
    exec(`ebook-convert "${baseName}" "${htmlzName}"`, Meteor.bindEnvironment((err, stdout, stderr) => {
      if(stdout)
        console.log(`${stdout}`)
      if(stderr)
        console.error(`${stderr}`)
      if(err)
        console.error(`Error: ${err}`)
      else {
        const target = fs.createReadStream(htmlzName)
        target.pipe(writeStream)
        if(fs.existsSync(baseName))
          fs.unlinkSync(baseName)
        const zip = new JsZip(fs.readFileSync(htmlzName))
        const metadata = zip.file("metadata.opf").asText()
        parseString(metadata, {explicitArray: false, mergeAttrs: true, charkey: "char"}, (err, result) => {
          if(err)
            console.error(`Error: ${err}`)
          else
            fileObj.update({$set: {"metadata.original": result.package.metadata, formatVersion: 0}})
          if(fs.existsSync(htmlzName))
            fs.unlinkSync(htmlzName)
        })
      }
    }))
  }
})

Books = new FS.Collection("books", {stores: [upload, htmlz]})

export {Books}

const title = (book) => {
  if(book.metadata)
    if(book.metadata.user && book.metadata.user.title)
      return book.metadata.user.title
    else if(book.metadata.original && book.metadata.original["dc:title"])
      return book.metadata.original["dc:title"]
    else
      return book.name()
  else
    return book.name()
}

const author = (book) => {
  if(book.metadata)
    if(book.metadata.user && book.metadata.user.author)
      return book.metadata.user.author
    else if(book.metadata.original && book.metadata.original["dc:creator"] && book.metadata.original["dc:creator"].char)
      return book.metadata.original["dc:creator"].char
}

export const BookListUI = ({books, canUpload, canRemove, remove}) => <div>
  <Helmet title="Books"/>
  <Navbar>
    <Navbar.Header>
      <Navbar.Brand>Alexandria</Navbar.Brand>
      { canUpload ? <Navbar.Toggle/> : null }
    </Navbar.Header>
{ canUpload ?     <Navbar.Collapse>
      <Nav>
        <LinkContainer to="/new"><NavItem>Upload</NavItem></LinkContainer>
      </Nav>
    </Navbar.Collapse> : null }
  </Navbar>
  <h1>Books</h1>
  <table>
    <thead>
      <tr>
        <th>Title</th>
        <th>Author</th>
        { canRemove ? <th>Actions</th> : null }
      </tr>
    </thead>
    <tbody>
      {books.map((b) => <tr>
        <td><Link to={`/books/${b._id}`}>{title(b)}</Link></td>
        <td>{author(b)}</td>
        { canRemove ? <td><Button onClick={() => {
          if(confirm("Are you sure?"))
            remove(b._id)()
        }}>Remove</Button></td>: null }
      </tr>)}
    </tbody>
  </table>
</div>

const BookListContainer = (props, onData) => {
  if(Meteor.subscribe("books").ready())
    onData(null, {
      books: Books.find({}, {sort: {"original.name": 1}}).fetch(),
      canUpload: hasPermission("modify"),
      canRemove: hasPermission("modify"),
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

  render() {
    if(this.props.uploadProgress != null)
      return <div>
        <Helmet title="Uploading"/>
        <h1>Uploading...</h1>
        <progress value={this.props.uploadProgress/100}/>
      </div>
    else
      return <div>
        <Helmet title="Upload Book"/>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand><Link to="/">Alexandria</Link></Navbar.Brand>
          </Navbar.Header>
        </Navbar>
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

let updateUploadProgress = null

const UploadContainer = (props, onData) => {
  onData(null, {
    onSubmit: (args) => {
      Books.insert(args.file, (err, fileObj) => {
        if(err) {
          console.log(err)
          toastr.error(err)
        } else
          fileObj.on("uploaded", () => browserHistory.push(`/books/${fileObj._id}`))
          onData(null, {uploadProgress: fileObj.uploadProgress()})
          updateUploadProgress = setInterval(() => onData(null, {uploadProgress: fileObj.uploadProgress()}), 1000)
      })
    }
  })
  return () => {
    if(updateUploadProgress) {
      clearInterval(updateUploadProgress)
      updateUploadProgress = null
    }
  }
}

export const Upload = composeWithTracker(UploadContainer)(UploadUI)

const BookDisplayUI = ({id, title, canDownload, canEditMetadata}) => <div>
  <Helmet title={title}/>
  <Navbar>
    <Navbar.Header>
      <Navbar.Brand><Link to="/">Alexandria</Link></Navbar.Brand>
      <Navbar.Toggle/>
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        { canDownload ? <NavItem href={`/files/${id}`}>Download</NavItem> : null }
        { canEditMetadata ? <LinkContainer to={`/books/${id}/edit`}><NavItem>Edit Metadata</NavItem></LinkContainer> : null }
      </Nav>
    </Navbar.Collapse>
  </Navbar>
  <iframe id="book-display" src={`/files/${id}/index.html`}/>
</div>

const BookDisplayContainer = (props, onData) => {
  if(Meteor.subscribe("books").ready()) {
    const id = props.params.id
    const book = Books.findOne(id)
    const canDownload = hasPermission("download")
    const canEditMetadata = hasPermission("modify")
    let ttl = title(book)
    if(!ttl)
      ttl = "Loading..."
    onData(null, {id, title: ttl, canDownload, canEditMetadata})
  }
}

export const BookDisplay = composeWithTracker(BookDisplayContainer)(BookDisplayUI)

const BookEditUI = React.createClass({

  form: forms.Form.extend({
    title: forms.CharField({required: false, widgetAttrs: {autoFocus: true}}),
    author: forms.CharField({required: false})
  }),

  onSubmit(e) {
    e.preventDefault()
    const form = this.refs.form.getForm()
    if(form.validate())
      this.props.onSubmit(form.cleanedData)
      .then(() => browserHistory.push(`/books/${this.props.id}`))
  },

  render() {
    const f = new this.form({initial: {title: this.props.title, author: this.props.author}})
    return <div>
      <Helmet title="Edit Metadata"/>
      <h1>Edit Metadata</h1>
      <form onSubmit={this.onSubmit}>
        <forms.RenderForm ref="form" form={f}>
          <BootstrapForm/>
        </forms.RenderForm>
        <Button type="submit">Save</Button>
        <Button onClick={() => browserHistory.push(`/books/${this.props.id}`)}>Cancel</Button>
      </form>
    </div>
  }

})

const BookEditContainer = (props, onData) => {
  if(Meteor.subscribe("books").ready()) {
    const id = props.params.id
    const book = Books.findOne(id)
    onData(null, {
      id,
      title: title(book),
      author: author(book),
      onSubmit: (args) => Meteor.promise("books.editMetadata", id, args)
    })
  }
}

export const BookEdit = composeWithTracker(BookEditContainer)(BookEditUI)
