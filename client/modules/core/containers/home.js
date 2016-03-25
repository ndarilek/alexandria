import {useDeps, composeWithTracker, composeAll} from "mantra-core"

import {Books} from "/lib/collections"
import Home from "../components/home"
import {hasPermission} from "../libs/sandstorm"

const composer = ({context}, onData) => {
  const {browserHistory, Meteor} = context()
  if(Meteor.subscribe("books").ready()) {
    const hasBooks = Books.find().count() != 0
    const canUpload = hasPermission("modify")
    onData(null, {})
    if(hasBooks || !canUpload)
      onData(null, {})
    else
      browserHistory.push("/new")
  }
}

export default composeAll(
  composeWithTracker(composer),
  useDeps()
)(Home)
