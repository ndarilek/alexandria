import actions from "./actions"

import {hasPermission} from "./libs/sandstorm"
import routes from "./routes"

export default {
  actions,
  routes,
  load({browserHistory}) {
    browserHistory.listen((location) => {
      window.parent.postMessage({
        setPath: location.pathname + location.hash
      }, '*')
    });
  }
}
