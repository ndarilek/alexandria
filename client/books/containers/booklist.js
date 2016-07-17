import {Meteor} from "meteor/meteor"
import {createContainer} from "meteor/react-meteor-data"
import {connect} from "react-redux"

import {remove} from "../actions"
import BookList from "../components/booklist"

import {hasPermission} from "/client/lib/sandstorm"
import {Books} from "/lib/collections"

const mapDispatchToProps = (dispatch) => ({
  remove: (id) => dispatch(remove(id))
})

export default createContainer(() => {
  Meteor.subscribe("books")
  const books = Books.find({}, {sort: {"metadata.user.title": 1, "metadata.original.dc:title": 1, "files.uploadFilename": 1}}).fetch()
  return {
    books,
    canUpload: hasPermission("modify"),
    canRemove: hasPermission("modify")
  }
}, connect(
  undefined,
  mapDispatchToProps
)(BookList))
