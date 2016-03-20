import React from  "react"
import {Col, Grid, Row} from "react-bootstrap"
import ReactDOM from  "react-dom"
import Helmet from "react-helmet"
import {composeWithTracker} from "react-komposer"
import {IndexRoute, Router, Route, browserHistory} from "react-router"

import {BookDisplay, BookEdit, BookList, Books, Upload} from "./alexandria.jsx"
import {hasPermission} from "./sandstorm"

const Layout = (props) => <div>
  <Helmet titleTemplate="%s - Alexandria"/>
  <Grid fluid={true}>
    <Row>
      <Col md={12}>
        <main>
          {props.children}
        </main>
      </Col>
    </Row>
  </Grid>
</div>

const HomeUI = (props) => <BookList {...props}/>

const HomeContainer = (props, onData) => {
  if(Meteor.subscribe("books").ready()) {
    const hasBooks = Books.find().count() != 0
    const canUpload = hasPermission("modify")
    if(hasBooks || !canUpload)
      onData(null, {})
    else
      browserHistory.push("/new")
  }
}

const Home = composeWithTracker(HomeContainer)(HomeUI)

if(Meteor.isClient)
  Meteor.startup(() => {
    browserHistory.listen((location) => {
      window.parent.postMessage({
        setPath: location.pathname + location.hash
      }, '*')
    });

    ReactDOM.render(<Router history={browserHistory}>
      <Route path="/" component={Layout}>
        <IndexRoute component={Home}/>
        <Route path="books/:id" component={BookDisplay}/>
        <Route path="books/:id/edit" component={BookEdit}/>
        <route path="new" component={Upload}/>
      </Route>
    </Router>, document.body)
  })
