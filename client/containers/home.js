import {createContainer} from "meteor/react-meteor-data"
import {connect} from "react-redux"
import {browserHistory} from "react-router"

import {Books} from "/lib/collections"
import Home from "../components/home"
import {hasPermission} from "../lib/sandstorm"

const mapStateToProps = (state) => ({
  hasBooks: state.books.length != 0
})

export default createContainer(() => {
  const canUpload = hasPermission("modify")
  let hasBooks = false
  if(Meteor.subscribe("books").ready()) {
    hasBooks = Books.find().count() != 0
    if(!hasBooks && canUpload)
      browserHistory.push("/new")
  }
  return {
    canUpload
  }
}, connect(
  mapStateToProps
)(Home))
