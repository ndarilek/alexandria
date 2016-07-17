import React from  "react"
import {Col, Grid, Row} from "react-bootstrap"
import Helmet from "react-helmet"

export default (props) => <div>
  <Helmet
    titleTemplate="%s - Alexandria"
    onChangeClientState={(state) => {
      if(state.title)
        window.parent.postMessage({"setTitle": state.title}, "*")
    }}
    />
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
