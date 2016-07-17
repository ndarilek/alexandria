import {Promise} from "bluebird"
import {Meteor} from "meteor/meteor"
import {createAction, handleActions} from "redux-actions"

const meteorCall = Promise.promisify(Meteor.call)

export const create = createAction("CREATE_BOOKMARK", (bookId, name, data) => meteorCall("bookmarks.create", bookId, name, data))

export const update = createAction("UPDATE_BOOKMARK", (id, bookmark) => meteorCall("bookmarks.update", id, bookmark))

export const remove = createAction("REMOVE_BOOKMARK", (id) => meteorCall("bookmarks.remove", id))

const SET_BOOKMARKS = "SET_BOOKMARKS"

export const set = createAction(SET_BOOKMARKS)

export const bookmarksReducer = handleActions({
  SET_BOOKMARKS: (state, action) => action.payload
}, [])

const SET_SELECTED_BOOKMARK = "SET_SELECTED_BOOKMARK"

export const setSelectedBookmark = createAction(SET_SELECTED_BOOKMARK)

export const selectedBookmarkReducer = handleActions({
  SET_SELECTED_BOOKMARK: (state, action) => action.payload
}, null)
