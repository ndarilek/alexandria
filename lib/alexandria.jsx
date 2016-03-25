import forms from "newforms"
import BootstrapForm from "newforms-bootstrap"
import Rangy from "rangy"
import React from "react"
import {Button, MenuItem, Modal, Nav, NavDropdown, NavItem, Navbar,} from "react-bootstrap"
import Helmet from "react-helmet"
import {composeWithTracker} from "react-komposer"
import {Link, browserHistory} from "react-router"
import {LinkContainer} from "react-router-bootstrap"
import toastr from "toastr"

import {hasPermission} from "./sandstorm"

Books = new Mongo.Collection("books")

export {Books}

Uploads = new FileCollection("uploads", {resumable: true})

export {Uploads}

export const Bookmarks = new Mongo.Collection("bookmarks")

const title = (book) => {
  if(book.metadata)
    if(book.metadata.user && book.metadata.user.title)
      return book.metadata.user.title
    else if(book.metadata.original && book.metadata.original["dc:title"])
      return book.metadata.original["dc:title"]
    else
      return book.files.uploadFilename
  else
    return book.files.uploadFilename
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
      books: Books.find({}, {sort: {"metadata.user.title": 1, "metadata.original.dc:title": 1, "files.uploadFilename": 1}}).fetch(),
      canUpload: hasPermission("modify"),
      canRemove: hasPermission("modify"),
      remove: (id) => (() => {
        Books.remove(id)
        Meteor.call("bookmarks.removeForBook", id)
      })
    })
}

export const BookList = composeWithTracker(BookListContainer)(BookListUI)

class UploadUI extends React.Component {

  componentDidMount() {
    Uploads.resumable.assignBrowse(this.refs.file)
    Uploads.resumable.on("fileAdded", this.props.fileAdded)
    Uploads.resumable.on("progress", (progress) => this.setState({progress}))
  }

  render() {
    if(this.props.converting)
      return <div>
        <h1>Converting...</h1>
      </div>
    else if(this.state && this.state.progress != null)
      return <div>
        <Helmet title="Uploading"/>
        <h1>Uploading...</h1>
        <progress value={this.state.progress}/>
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
        <input type="file" ref="file"/>
      </div>
  }

}

const UploadContainer = (props, onData) => {
  data = {}
  data.fileAdded = (file) => {
    Uploads.insert({
      _id: file.uniqueIdentifier,
      filename: file.fileName,
      contentType: file.file.type
    }, (err) => {
      if(err)
        console.error(err)
      else {
        Uploads.resumable.on("complete", () => {
          data.converting = true
          Meteor.promise("books.create", file.uniqueIdentifier)
          .then((id) => browserHistory.push(`/books/${id}`))
          onData(null, data)
        })
        Uploads.resumable.upload()
      }
    })
  }
  onData(null, data)
}

export const Upload = composeWithTracker(UploadContainer)(UploadUI)

const NewBookmarkUI = React.createClass({

  form: forms.Form.extend({
    name: forms.CharField({widgetAttrs: {autoFocus: true}})
  }),

  onSubmit(e) {
    e.preventDefault()
    const form = this.refs.form.getForm()
    if(form.validate())
      this.props.onSubmit(form.cleanedData)
      .then(() => this.props.close())
  },

  render() {
    return <Modal show={this.props.show}>
      <Modal.Header closeButton>
        <Modal.Title>New Bookmark</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={this.onSubmit}>
          <forms.RenderForm ref="form" form={this.form}>
            <BootstrapForm/>
          </forms.RenderForm>
          <Button type="submit">Create</Button>
          <Button onClick={this.props.close}>Cancel</Button>
        </form>
      </Modal.Body>
    </Modal>
  }

})

const BookmarksMenuUI = ({shouldDisplayBookmarks, shouldDisplayBookmarkRemove, bookmarkSelected, bookmarks}) => <span>
  { shouldDisplayBookmarks ? <NavDropdown id="bookmarks" title="Bookmarks">
    { bookmarks.map((b) => <MenuItem eventKey={b._id} onSelect={bookmarkSelected}>{ b.name ? <span>{b.name}</span> : <span>Default</span> }</MenuItem>) }
    <MenuItem divider/>
    <MenuItem eventKey="new" onSelect={bookmarkSelected}>New...</MenuItem>
  </NavDropdown>: null }
  { shouldDisplayBookmarkRemove ? <Button>Remove Bookmark</Button> : null }
</span>

let selectionWatcher = null

const BookmarksMenuContainer = ({id}, onData) => {
  if(Meteor.subscribe("bookmarks", id).ready()) {
    const data = {}
    data.shouldDisplayBookmarks = Meteor.userId() != null
    if(data.shouldDisplayBookmarks && !Bookmarks.findOne({bookId: id, name: ""}))
      Meteor.promise("bookmarks.create", id)
    data.selectedBookmark = new ReactiveVar(Bookmarks.findOne({bookId: id, name: ""}))
    data.bookmarks = Bookmarks.find({bookId: id}).fetch()
    data.shouldDisplayBookmarkRemove = false
    data.showNewBookmarkUI = false
    data.newBookmark = (args) => Meteor.promise("bookmarks.create", args)
    data.closeNewBookmarkUI = () => onData(null, data)
    data.bookmarkSelected = (bookmarkId) => {
      if(bookmarkId == "new") {
        data.shouldDisplayBookmarkRemove = false
        data.showNewBookmarkUI = true
      } else {
        data.showNewBookmarkUI = false
        data.selectedBookmark.set(Bookmarks.findOne(bookmarkId))
        if(data.selectedBookmark.get())
          if(data.selectedBookmark.get().name)
            data.shouldDisplayBookmarkRemove = true
          else
            data.shouldDisplayBookmarkRemove = false
      }
      onData(null, data)
    }
    Tracker.autorun(() => {
      const bookmark = data.selectedBookmark.get()
      console.log("Bookmark", bookmark)
      if(bookmark && bookmark.sessionId != Meteor.connection._lastSessionId) {
        const selection = Rangy.getSelection(document.getElementById("book-display"))
        const data = bookmark.data
        const container = document.getElementById("book-display")
        if(container && data.rangeBookmarks.length) {
          data.rangeBookmarks[0].containerNode = (container.contentDocument || container.contentWindow.document)
          data.rangeBookmarks[0].containerNode = data.rangeBookmarks[0].containerNode.body
          console.log("Updating position", data.rangeBookmarks[0])
          selection.moveToBookmark(data)
        }
      }
    })
    if(!selectionWatcher) {
      console.log("Starting selectionWatcher")
      selectionWatcher = setInterval(() => {
        const selection = Rangy.getSelection(document.getElementById("book-display"))
        const bookmark = selection.getBookmark()
        if(bookmark.rangeBookmarks.length && data.selectedBookmark.get() && bookmark.rangeBookmarks[0].start != data.selectedBookmark.get().data.rangeBookmarks[0].start) {
          console.log("Updating bookmark", data.selectedBookmark.get().data.rangeBookmarks[0], bookmark.rangeBookmarks[0])
          const id = data.selectedBookmark.get()._id
          Meteor.promise("bookmarks.update", id, bookmark)
          .then(() => data.selectedBookmark.set(Bookmarks.findOne(id)))
        }
      }, 5000)
    }
    onData(null, data)
  }
  return () => {
    if(selectionWatcher) {
      clearInterval(selectionWatcher)
      selectionWatcher = null
    }
  }
}

const BookmarksMenu = composeWithTracker(BookmarksMenuContainer)(BookmarksMenuUI)

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
        <BookmarksMenu id={id}/>
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
