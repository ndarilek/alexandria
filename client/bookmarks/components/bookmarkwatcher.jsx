import React from "react"

export default class extends React.Component {

  componentWillUnmount() {
    if(this.props.componentWillUnmount)
      this.props.componentWillUnmount()
  }

  render() {
    return null
  }

}
