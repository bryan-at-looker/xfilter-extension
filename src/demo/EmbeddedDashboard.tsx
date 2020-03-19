import React, { useState, useContext, useEffect, useCallback } from 'react';
import {ExtensionContext, ExtensionContextData} from '@looker/extension-sdk-react'
import { LookerEmbedSDK } from '@looker/embed-sdk'
import {LoadingSvg} from './LoadingSvg'
import styled, {keyframes} from 'styled-components'
import { Card } from '@looker/components';
import { isEqual, debounce, throttle } from 'lodash'
import { ExtensionHostApi } from "@looker/extension-sdk"

const FILTER_FIELD = 'products.sku'
const DASHBOARD_FILTER = 'SKU'
const TIMEOUT = 1500
let gDashboard: any;
let gFilters: any;

export function EmbeddedDashboard( ) {
  const [loading, setLoading] = useState(true)
  // const [dashboard_filter, setDashboardFilter] = useState<any>({})
  const [clicked_filterable, setClickedFilterable] = useState("")
  const [clicking, setClicking] = useState(false);
  const [clicking_timeout, setClickingTimeout] = useState();
  const extensionContext = useContext<ExtensionContextData>(ExtensionContext)

  const dashboardSetup = (dashboard: any) => {
    if (dashboard) { 
      gDashboard = dashboard
    }
  }

  const dashboardLoaded = (e: any) => {
    gFilters = e.dashboard?.dashboard_filters || {}
  }

  const updateFilters = (e: any) => {
    const new_dashboard_filters = e.dashboard?.dashboard_filters
    if (!isEqual(gFilters,new_dashboard_filters)) {
      gFilters = new_dashboard_filters
      if (gDashboard) {
        gDashboard.run()
      }
    }
  }

  useEffect ( () => {
    const new_filters = Object.assign(gFilters || {}, {[DASHBOARD_FILTER]: clicked_filterable })
    if (gDashboard) {
      gDashboard.updateFilters(new_filters)
      if (clicking_timeout) {
        clearTimeout(clicking_timeout);
      }
      setClickingTimeout( setTimeout( () => {     
        setClicking(false)
      }, TIMEOUT ) )
    }
  }, [clicked_filterable] )

  useEffect ( () => {
    if (!clicking && gDashboard) {
      gDashboard.run() 
    }
  },[clicking])

  useEffect( ()=>{
    setLoading(true);
    // @ts-ignore
    const host_url = extensionContext?.extensionSDK?.lookerHostData?.hostUrl
    const container = document.getElementById('looker')

    if (container && container.childElementCount > 0) {
      const last_child = container.lastChild
      if (last_child) { container.removeChild(last_child) }
    }
    if (host_url && container) {
      LookerEmbedSDK.init(host_url)
      LookerEmbedSDK.createDashboardWithId('2')
        .appendTo(container)
        .on('dashboard:loaded', dashboardLoaded)
        .on('dashboard:filters:changed', updateFilters)
        .on('dashboard:run:complete', ()=>{
          setLoading(false);
        })
        .on('drillmenu:click', (e: any)=>{return drillClick(e,host_url)})
        // .withNext()
        .build()
        .connect()
        .then(dashboardSetup)
        .catch((error: Error) => {
          console.error('Connection error', error)
        })
    }
  },[])

  const drillClick = (e:any, host_url: string)=>{
    setClicking(true)
    const url = new URL(`${host_url}${e.url}`)
    const clicked_filter = url.searchParams.get(`f[${FILTER_FIELD}]`)
    if (clicked_filter) {
      let new_filter;
      if ( gFilters && gFilters[DASHBOARD_FILTER]) {
        new_filter = removeOrAddElement(gFilters[DASHBOARD_FILTER], clicked_filter)
      } else {
        new_filter = clicked_filter
      }
      // const append_filter = (gFilters && gFilters[DASHBOARD_FILTER]) ? gFilters[DASHBOARD_FILTER]+','+clicked_filter : clicked_filter
      setClickedFilterable(new_filter)
    }
    return {cancel: true}
  }

  const svg_display = (loading) ? '' : 'none'
  const embed_display = (loading) ? {display: 'none'} : {}
  return (
    <>
    <SvgContainer style= {{display: svg_display}}>
      <LoadingSvg></LoadingSvg>
    </SvgContainer>
    <EmbedContainer style= {embed_display} id='looker'>
    </EmbedContainer>
    </>
  );
}


const slide_down_webkit = keyframes`
0% {
  -webkit-transform: translateZ(-1400px) translateY(-800px) translateX(1000px);
          transform: translateZ(-1400px) translateY(-800px) translateX(1000px);
  opacity: 0;
}
100% {
  -webkit-transform: translateZ(0) translateY(0) translateX(0);
          transform: translateZ(0) translateY(0) translateX(0);
  opacity: 1;
}
`

const slide_down = keyframes`
0% {
  -webkit-transform: translateZ(-1400px) translateY(-800px) translateX(1000px);
          transform: translateZ(-1400px) translateY(-800px) translateX(1000px);
  opacity: 0;
}
100% {
  -webkit-transform: translateZ(0) translateY(0) translateX(0);
          transform: translateZ(0) translateY(0) translateX(0);
  opacity: 1;
}
`


const EmbedContainer = styled(Card)`
  display: block;
	-webkit-animation: ${slide_down_webkit} 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  animation: ${slide_down} 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  width: 100%;
  margin: auto;
  height: 100%;
  & > iframe {
    width: 100%;
    height: 100%;
  }
`

const SvgContainer = styled.div`
  width: 90%;
  margin: auto;
  height: 90%;
  frameborder: 0;
`

function removeOrAddElement(filter_string: string, elem: string) {
  let split_current_filter = filter_string.split(',')
  const index_of = split_current_filter.indexOf(elem)
  if ( index_of > -1 ) {
    split_current_filter.splice(index_of, 1)
    return split_current_filter.join(',')
  } else {
   return  filter_string+','+elem
  }
} 