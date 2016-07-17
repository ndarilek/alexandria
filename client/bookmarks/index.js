import {Meteor} from "meteor/meteor"
import {Tracker} from "meteor/tracker"
import Rangy from "rangy"

import {Bookmarks} from "/lib/collections"
import {set} from "./actions"
import BookmarkWatcher from "./containers/bookmarkwatcher"
import BookmarksMenu from "./containers/bookmarksmenu"

export const updateBookPosition = (store) => {
  store.subscribe(() => {
    const state = store.getState()
    const selectedBookmark = state.selectedBookmark
    if(selectedBookmark && state.bookmarks) {
      const bookmark = state.bookmarks.find((v) => v._id == selectedBookmark)
      if(bookmark && bookmark.sessionId != Meteor.connection._lastSessionId) {
        const selection = Rangy.getSelection(document.getElementById("book-display"))
        const data = bookmark.data
        let container = document.getElementById("book-display")
        if(container)
          container = (container.contentDocument || container.contentWindow.document)
        if(container)
          container = container.body
        if(container && data.rangeBookmarks.length) {
          data.rangeBookmarks[0].containerNode = container
          //console.log("containerNode", data.rangeBookmarks[0].containerNode)
          console.log("Updating position", data.rangeBookmarks[0])
          selection.moveToBookmark(data)
        }
      }
    }
  })
}

export {
  BookmarkWatcher,
  BookmarksMenu
}

export const syncBookmarks = (store) => {
  Tracker.autorun(() => store.dispatch(set(Bookmarks.find().fetch())))
}
