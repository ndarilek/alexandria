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
            fileObj.update({$set: {metadata: result.package.metadata, formatVersion: 0}})
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
  if(book.metadata && book.metadata["dc:title"])
    return book.metadata["dc:title"]
  else
    return book.name()
}

const author = (book) => {
  if(book.metadata && book.metadata["dc:creator"] && book.metadata["dc:creator"].char)
    return book.metadata["dc:creator"].char
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
        <Helmet title="Uploading"/>
        <h1>Uploading...</h1>
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

const BookDisplayUI = ({id, title, canDownload}) => <div>
  <Helmet title={title}/>
  <Navbar>
    <Navbar.Header>
      <Navbar.Brand><Link to="/">Alexandria</Link></Navbar.Brand>
      <Navbar.Toggle/>
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        { canDownload ? <NavItem href={`/files/${id}`}>Download</NavItem> : null }
      </Nav>
    </Navbar.Collapse>
  </Navbar>
  <iframe src={`/files/${id}/index.html`}/>
</div>

const BookDisplayContainer = (props, onData) => {
  if(Meteor.subscribe("books").ready()) {
    const id = props.params.id
    const book = Books.findOne(id)
    const canDownload = hasPermission("download")
    let ttl = title(book)
    if(!ttl)
      ttl = "Loading..."
    onData(null, {id, title: ttl, canDownload})
  }
}

export const BookDisplay = composeWithTracker(BookDisplayContainer)(BookDisplayUI)
