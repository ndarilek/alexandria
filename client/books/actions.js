import {Promise} from "bluebird"
import {Meteor} from "meteor/meteor"
import {createAction, handleActions} from "redux-actions"

import {Uploads} from "/lib/collections"

const meteorCall = Promise.promisify(Meteor.call)

export const create = createAction("CREATE_BOOK", async (fileId) => meteorCall("books.create", fileId))

export const edit = createAction("EDIT_BOOK", async (id, args) => meteorCall("books.editMetadata", id, args))

export const remove = createAction("REMOVE_BOOK", async (id) => meteorCall("books.remove", id))

const SET_BOOKS = "SET_BOOKS"

export const set = createAction(SET_BOOKS)

const FILE_ADDED = "FILE_ADDED"

export const fileAdded = createAction(FILE_ADDED, (file) => new Promise((resolve, reject) => {
  Uploads.insert({
    _id: file.uniqueIdentifier,
    filename: file.fileName,
    contentType: file.file.type
  }, (err) => {
    if(err)
      return reject(err)
    Uploads.resumable.upload()
    Uploads.resumable.on("complete", () => resolve(file.uniqueIdentifier))
  })
}))

export const reducer = handleActions({
  SET_BOOKS: (state, action) => action.payload
}, [])
