import React from  "react"
import {Col, Grid, Row} from "react-bootstrap"
import Helmet from "react-helmet"

export default (props) => <div>
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
