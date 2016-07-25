import React from "react"
import {Nav, NavItem, Navbar} from "react-bootstrap"
import Helmet from "react-helmet"
import {Link} from "react-router"
import {LinkContainer} from "react-router-bootstrap"

import {BookmarksMenu, BookmarkWatcher} from "/client/bookmarks"

export default (props) => <div>
  <Helmet title={props.title}/>
  <Navbar>
    <Navbar.Header>
      <Navbar.Brand><Link to="/">Alexandria</Link></Navbar.Brand>
      <Navbar.Toggle/>
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav>
        { props.canDownload ? <NavItem href={`/files/${props.id}`}>Download</NavItem> : null }
        <BookmarksMenu {...props}/>
        { props.canEditMetadata ? <LinkContainer to={`/books/${props.id}/edit`}><NavItem>Edit Metadata</NavItem></LinkContainer> : null }
      </Nav>
    </Navbar.Collapse>
  </Navbar>
  <BookmarkWatcher {...props}/>
  <iframe role="document" id="book-display" src={`/files/${props.id}/index.html`}/>
</div>
