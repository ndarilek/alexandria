import {connect} from "react-redux"

import {create, fileAdded} from "../actions"
import Upload from "../components/upload"

const mapDispatchToProps = (dispatch) => ({
  create: (id) => dispatch(create(id)),
  fileAdded: (file) => dispatch(fileAdded(file))
})

export default connect(
  undefined,
  mapDispatchToProps
)(Upload)
