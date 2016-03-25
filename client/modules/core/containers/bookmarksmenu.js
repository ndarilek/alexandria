import {useDeps, composeWithTracker, composeAll} from "mantra-core"

import {Bookmarks} from "/lib/collections"
import BookmarksMenu from "../components/bookmarksmenu"

const composer = ({actions, context, id}, onData) => {
  const {Meteor, State} = context()
  const {bookmarks} = actions()
  if(Meteor.subscribe("bookmarks", id).ready()) {
    const data = {}
    data.shouldDisplayBookmarks = Meteor.userId() != null
    if(data.shouldDisplayBookmarks && !Bookmarks.findOne({bookId: id, name: ""}))
      bookmarks.create(id)
    State.set("selectedBookmark", Bookmarks.findOne({bookId: id, name: ""}))
    data.bookmarks = Bookmarks.find({bookId: id}).fetch()
    State.set("shouldDisplayBookmarkRemove", false)
    data.showNewBookmarkUI = false
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

const depsMapper = (context, actions) => ({
  create: actions.books.create,
  context: () => context
})

export default composeAll(
  composeWithTracker(composer),
  useDeps(depsMapper)
)(BookmarksMenu)
