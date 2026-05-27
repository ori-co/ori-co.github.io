// Entry point — registers all ECS components then initialises XR8 + ECS scene.
// The webpack entry resolves this file; all side-effect imports below ensure
// components are registered with window.ecs before application.init() fires.

import './components/platform-state'
import './components/progressive-build'
import './components/gyro-physics'
import './components/connection-line'
import './components/cta-overlay'

import scene from './.expanse.json'
import cardBack from '../image-targets/ImageTarget_faceB.json'

const onXrLoaded = () => {
  // Register compiled image target with XR8 controller
  XR8.XrController.configure({
    imageTargetData: [cardBack],
  })

  // Landing-page module shows the camera-permission screen.
  // Guard: landing-page.js is async — may not be ready when xrloaded fires.
  if (typeof LandingPage !== 'undefined') {
    XR8.addCameraPipelineModule(LandingPage.pipelineModule())
  }
}

// Initialise the ECS scene (registers spaces, entities, components from expanse)
ecs.application.init(scene)

// XR8 may already be ready (fast devices) or we wait for the event
if ((window as any).XR8) {
  onXrLoaded()
} else {
  window.addEventListener('xrloaded', onXrLoaded)
}
