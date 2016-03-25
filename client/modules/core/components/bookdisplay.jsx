import React from "react"
import {Nav, NavItem, Navbar} from "react-bootstrap"
import Helmet from "react-helmet"
import {Link} from "react-router"
import {LinkContainer} from "react-router-bootstrap"

import BookmarksMenu from "../containers/bookmarksmenu"
import BookmarkWatcher from "../containers/bookmarkwatcher"

export default ({id, title, canDownload, canEditMetadata}) => <div>
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
  <BookmarkWatcher id={id}/>
  <iframe id="book-display" src={`/files/${id}/index.html`}/>
</div>
