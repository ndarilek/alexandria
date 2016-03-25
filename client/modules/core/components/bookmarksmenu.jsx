import React from "react"
import {Button, MenuItem, NavDropdown, } from "react-bootstrap"

export default ({shouldDisplayBookmarks, shouldDisplayBookmarkRemove, bookmarkSelected, bookmarks}) => <span>
  { shouldDisplayBookmarks ? <NavDropdown id="bookmarks" title="Bookmarks">
    { bookmarks.map((b) => <MenuItem eventKey={b._id} onSelect={bookmarkSelected}>{ b.name ? <span>{b.name}</span> : <span>Default</span> }</MenuItem>) }
    <MenuItem divider/>
    <MenuItem eventKey="new" onSelect={bookmarkSelected}>New...</MenuItem>
  </NavDropdown>: null }
  { shouldDisplayBookmarkRemove ? <Button>Remove Bookmark</Button> : null }
</span>
