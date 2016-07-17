import React from "react"
import {Button, Nav, NavItem, Navbar} from "react-bootstrap"
import Helmet from "react-helmet"
import {Link} from "react-router"
import {LinkContainer} from "react-router-bootstrap"

import {author, title} from "../../lib/book"

export default ({books, canUpload, canRemove, remove}) => <div>
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
      {books.map((b) => <tr key={b._id}>
        <td><Link to={`/books/${b._id}`}>{title(b)}</Link></td>
        <td>{author(b)}</td>
        { canRemove ? <td><Button onClick={() => {
          if(confirm("Are you sure?"))
            remove(b._id)
        }}>Remove</Button></td>: null }
      </tr>)}
    </tbody>
  </table>
</div>
