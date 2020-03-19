import React, {useContext} from 'react'
import {Banner} from '@looker/components'
import {  ExtensionContext,  ExtensionContextData } from '@looker/extension-sdk-react'
import {Switch, Route, RouteComponentProps, withRouter, MemoryRouter} from 'react-router-dom'
import { hot } from "react-hot-loader/root"
import { EmbeddedDashboard } from './EmbeddedDashboard'

class ExtensionInternal extends React.Component<any, any> {
  static contextType = ExtensionContext
  context!: React.ContextType<typeof ExtensionContext>

  constructor(props: RouteComponentProps) {
    super(props)
    this.state = {}
  }

  async componentDidMount() { 
    let sdk = this.context.coreSDK
    const user = await sdk.ok(sdk.me())
    this.setState({user})
  }

  componentDidUpdate() { }

  render() {
    if (this.context.initializeError) {
      return <Banner intent='error'>{this.context.initializeError}</Banner>
    }
    return (
      <>
        <EmbeddedDashboard></EmbeddedDashboard>
      </>
    )
  }
}

export const Extension = hot(withRouter(ExtensionInternal))
