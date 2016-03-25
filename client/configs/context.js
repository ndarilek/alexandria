import {browserHistory} from "react-router"
import {Meteor} from "meteor/meteor"
import {ReactiveDict} from "meteor/reactive-dict"
import {Tracker} from "meteor/tracker"

export default () => ({
  browserHistory,
  Meteor,
  State: new ReactiveDict(),
  Tracker
})
