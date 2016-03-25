import {useDeps, composeWithTracker, composeAll} from "mantra-core"

import {Bookmarks} from "/lib/collections"
import BookmarksMenu from "../components/bookmarksmenu"

const composer = ({context, id}, onData) => {
  const {Meteor, State} = context()
  if(Meteor.subscribe("bookmarks", id).ready()) {
    const data = {}
    data.shouldDisplayBookmarks = Meteor.userId() != null
    if(data.shouldDisplayBookmarks && !Bookmarks.findOne({bookId: id, name: ""}))
      Meteor.promise("bookmarks.create", id)
    State.set("selectedBookmark", Bookmarks.findOne({bookId: id, name: ""}))
    data.bookmarks = Bookmarks.find({bookId: id}).fetch()
    State.set("shouldDisplayBookmarkRemove", false)
    data.showNewBookmarkUI = false
    data.newBookmark = (args) => Meteor.promise("bookmarks.create", args)
    data.closeNewBookmarkUI = () => onData(null, data)
    data.bookmarkSelected = (bookmarkId) => {
      if(bookmarkId == "new") {
        State.set("shouldDisplayBookmarkRemove", false)
        data.showNewBookmarkUI = true
      } else {
        data.showNewBookmarkUI = false
        State.set("selectedBookmark", Bookmarks.findOne(bookmarkId))
        if(State.get("selectedBookmark"))
          if(State.get("selectedBookmark").name)
            State.set("shouldDisplayBookmarkRemove", true)
          else
            State.set("shouldDisplayBookmarkRemove", false)
      }
      onData(null, data)
    }
    onData(null, data)
  }
}

export default composeAll(
  composeWithTracker(composer),
  useDeps()
)(BookmarksMenu)
