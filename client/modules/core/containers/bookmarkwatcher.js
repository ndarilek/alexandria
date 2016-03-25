import {useDeps, composeWithTracker, composeAll} from "mantra-core"
import Rangy from "rangy"

import {Bookmarks} from "/lib/collections"
import BookmarkWatcher from "../components/bookmarkwatcher"

let selectionWatcher = null

const composer = ({actions, context, id}, onData) => {
  const {Meteor, State} = context()
  const {bookmarks} = actions()
  if(Meteor.subscribe("bookmarks", id).ready()) {
    Tracker.autorun(() => {
      const bookmark = State.get("selectedBookmark")
      console.log("Bookmark", bookmark.data.rangeBookmarks[0])
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
    })
    if(!selectionWatcher) {
      console.log("Starting selectionWatcher")
      selectionWatcher = setInterval(() => {
        const selection = Rangy.getSelection(document.getElementById("book-display"))
        const bookmark = selection.getBookmark()
        const selectedBookmark = State.get("selectedBookmark")
        if(bookmark.rangeBookmarks.length && selectedBookmark && bookmark.rangeBookmarks[0].start != selectedBookmark.data.rangeBookmarks[0].start) {
          console.log("Updating bookmark", bookmark)
          const id = selectedBookmark._id
          delete bookmark.rangeBookmarks[0].containerNode
          bookmarks.update(id, bookmark)
          .then(() => State.set("selectedBookmark", Bookmarks.findOne(id)))
        }
      }, 5000)
    }
    onData(null, {})
  }
  return () => {
    if(selectionWatcher) {
      clearInterval(selectionWatcher)
      selectionWatcher = null
    }
  }
}

export default composeAll(
  composeWithTracker(composer),
  useDeps()
)(BookmarkWatcher)
