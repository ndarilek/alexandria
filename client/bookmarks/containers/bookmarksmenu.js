import {Meteor} from "meteor/meteor"
import {createContainer} from "meteor/react-meteor-data"
import {connect} from "react-redux"

import {Bookmarks} from "/lib/collections"
import {create, setSelectedBookmark} from "../actions"
import BookmarksMenu from "../components/bookmarksmenu"

const mapStateToProps = (state) => ({
  bookmarks: state.bookmarks
})

const mapDispatchToProps = (dispatch) => ({
  setSelectedBookmark: (id) => dispatch(setSelectedBookmark(id))
})

export default createContainer((props) => {
  const {id} = props
  const data = {}
  data.shouldDisplayBookmarks = Meteor.userId() != null
  if(Meteor.subscribe("bookmarks", id).ready()) {
    if(data.shouldDisplayBookmarks && !Bookmarks.findOne({bookId: id, name: ""}))
      create(id)
    setSelectedBookmark(Bookmarks.findOne({bookId: id, name: ""}))
  }
  return data
}, connect(
  mapStateToProps,
  mapDispatchToProps
)(BookmarksMenu))
