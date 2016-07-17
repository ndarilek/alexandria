import React from "react"
import {Button, MenuItem, NavDropdown} from "react-bootstrap"

export default ({shouldDisplayBookmarks, bookmarkSelected, bookmarks}) => {
  if(shouldDisplayBookmarks)
    return <NavDropdown id="bookmarks" title="Bookmarks">
      { bookmarks.map((b) => <MenuItem key={b._id} eventKey={b._id} onSelect={bookmarkSelected}>{ b.name ? <span>{b.name}</span> : <span>Default</span> }</MenuItem>) }
      <MenuItem divider/>
      <MenuItem eventKey="new" onSelect={bookmarkSelected}>New...</MenuItem>
    </NavDropdown>
  else
    return <span/>
}
