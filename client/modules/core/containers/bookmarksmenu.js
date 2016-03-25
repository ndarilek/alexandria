import {useDeps, composeWithTracker, composeAll} from "mantra-core"
import Rangy from "rangy"

import {Bookmarks} from "/lib/collections"
import BookmarksMenu from "../components/bookmarksmenu"

let selectionWatcher = null

const composer = ({context, id}, onData) => {
  const {Meteor, State} = context()
  if(Meteor.subscribe("bookmarks", id).ready()) {
    const data = {}
    data.shouldDisplayBookmarks = Meteor.userId() != null
    if(data.shouldDisplayBookmarks && !Bookmarks.findOne({bookId: id, name: ""}))
      Meteor.promise("bookmarks.create", id)
    data.selectedBookmark = new ReactiveVar(Bookmarks.findOne({bookId: id, name: ""}))
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
        data.selectedBookmark.set(Bookmarks.findOne(bookmarkId))
        if(data.selectedBookmark.get())
          if(data.selectedBookmark.get().name)
            State.set("shouldDisplayBookmarkRemove", true)
          else
            State.set("shouldDisplayBookmarkRemove", false)
      }
      onData(null, data)
    }
    Tracker.autorun(() => {
      const bookmark = data.selectedBookmark.get()
      console.log("Bookmark", bookmark)
      if(bookmark && bookmark.sessionId != Meteor.connection._lastSessionId) {
        const selection = Rangy.getSelection(document.getElementById("book-display"))
        const data = bookmark.data
        const container = document.getElementById("book-display")
        if(container && data.rangeBookmarks.length) {
          data.rangeBookmarks[0].containerNode = (container.contentDocument || container.contentWindow.document)
          data.rangeBookmarks[0].containerNode = data.rangeBookmarks[0].containerNode.body
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
        if(bookmark.rangeBookmarks.length && data.selectedBookmark.get() && bookmark.rangeBookmarks[0].start != data.selectedBookmark.get().data.rangeBookmarks[0].start) {
          console.log("Updating bookmark", data.selectedBookmark.get().data.rangeBookmarks[0], bookmark.rangeBookmarks[0])
          const id = data.selectedBookmark.get()._id
          Meteor.promise("bookmarks.update", id, bookmark)
          .then(() => data.selectedBookmark.set(Bookmarks.findOne(id)))
        }
      }, 5000)
    }
    onData(null, data)
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
)(BookmarksMenu)
