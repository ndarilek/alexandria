import {useDeps, composeWithTracker, composeAll} from "mantra-core"

import Upload from "../components/upload"

import {Uploads} from "/lib/collections"
import {hasPermission} from "../libs/sandstorm"

const composer = ({actions, context}, onData) => {
  const {browserHistory, Meteor} = context()
  const {books} = actions()
  data = {}
  data.fileAdded = (file) => {
    Uploads.insert({
      _id: file.uniqueIdentifier,
      filename: file.fileName,
      contentType: file.file.type
    }, (err) => {
      if(err)
        console.error(err)
      else {
        Uploads.resumable.on("complete", () => {
          data.converting = true
          books.create(file.uniqueIdentifier)
          .then((id) => browserHistory.push(`/books/${id}`))
          onData(null, data)
        })
        Uploads.resumable.upload()
      }
    })
  }
  onData(null, data)
}

export default composeAll(
  composeWithTracker(composer),
  useDeps()
)(Upload)
