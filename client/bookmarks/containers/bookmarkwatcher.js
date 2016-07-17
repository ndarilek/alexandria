import {createContainer} from "meteor/react-meteor-data"
import Rangy from "rangy"
import {connect} from "react-redux"

import {Bookmarks} from "/lib/collections"
import {setSelectedBookmark, update} from "../actions"
import BookmarkWatcher from "../components/bookmarkwatcher"

const mapStateToProps = (state) => ({
  bookmark: state.bookmarks.find((v) => v._id == state.selectedBookmark)
})

const mapDispatchToProps = (dispatch) => ({
  update: (id, bookmark) => dispatch(update(id, bookmark))
})

let selectionWatcher = null

const mergeProps = (stateProps, dispatchProps, props) => {
  if(!selectionWatcher) {
    console.log("Starting selectionWatcher")
    selectionWatcher = setInterval(() => {
      const selection = Rangy.getSelection(document.getElementById("book-display"))
      const bookmark = selection.getBookmark()
      const selectedBookmark = stateProps.bookmark
      if(bookmark.rangeBookmarks.length && selectedBookmark && bookmark.rangeBookmarks[0].start != selectedBookmark.data.rangeBookmarks[0].start) {
        console.log("Updating bookmark", selectedBookmark)
        const id = selectedBookmark._id
        delete bookmark.rangeBookmarks[0].containerNode
        dispatchProps.update(id, bookmark)
      }
    }, 5000)
  }
  return {
    componentWillUnmount() {
      if(selectionWatcher) {
        clearInterval(selectionWatcher)
        selectionWatcher = null
        setSelectedBookmark()
      }
    }
  }
}

export default createContainer((props) => {
  Meteor.subscribe("bookmarks", props.id)
  return {}
}, connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(BookmarkWatcher))
