import {createApp} from "mantra-core"

import initContext from "./configs/context"

import coreModule from "./modules/core"

const app = createApp(initContext())
app.loadModule(coreModule)

app.init()
