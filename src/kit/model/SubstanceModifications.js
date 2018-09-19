import {
  Surface as SubstanceSurface,
  ContainerEditor as SubstanceContainerEditor,
  IsolatedNodeComponent as SubstanceIsolatedNodeComponent,
  IsolatedInlineNodeComponent as SubstanceIsolatedInlineNodeComponent,
  TextPropertyComponent as SubstanceTextPropertyComponent,
  TextPropertyEditor as SubstanceTextPropertyEditor,
  platform,
  DefaultDOMElement
} from 'substance'

import ClipboardNew from './ClipboardNew'

/*
  This file contains derivations of core classes that
  are necessary to be compatible with the AppState and the Model API.
*/

export class SurfaceNew extends ModifiedSurface(SubstanceSurface) {}

// TODO: try to provide basic Surface and ContainerEditor implementations
// making it easier to use a different data binding mechanism
export class TextPropertyEditorNew extends ModifiedSurface(SubstanceTextPropertyEditor) {
  // overriding event registration
  didMount () {
    super.didMount()

    let appState = this.context.appState
    appState.addObserver(['selection'], this._onSelectionChanged, this, {
      stage: 'render'
    })
  }

  dispose () {
    super.dispose()

    this.context.appState.off(this)
  }

  render ($$) {
    let el = super.render($$)
    if (this.isEditable()) {
      el.addClass('sm-editable')
    } else {
      el.addClass('sm-readonly')
      // HACK: removing contenteditable if not editable
      // TODO: we should fix substance.TextPropertyEditor to be consistent with props used in substance.Surface
      el.setAttribute('contenteditable', false)
    }
    return el
  }
}

/*
  Customized ContainerEditor that produces a fall-back display
  for nodes which are not supported yet.
*/
// TODO: try to provide basic Surface and ContainerEditor implementations
// making it easier to use a different data binding mechanism
export class ContainerEditorNew extends ModifiedSurface(SubstanceContainerEditor) {
  // overriding event registration
  didMount () {
    super.didMount()

    let appState = this.context.appState
    appState.addObserver(['selection'], this._onSelectionChanged, this, {
      stage: 'render'
    })
    appState.addObserver(['document'], this._onContainerChanged, this, {
      stage: 'render',
      document: {
        path: this.container.getContentPath()
      }
    })
  }

  dispose () {
    super.dispose()

    this.context.appState.off(this)
  }

  // overriding this to control editability
  render ($$) {
    let el = super.render($$)

    if (this.isEditable()) {
      el.addClass('sm-editable')
    } else {
      el.addClass('sm-readonly')
      // HACK: removing contenteditable if not editable
      // TODO: we should fix substance.TextPropertyEditor to be consistent with props used in substance.Surface
      el.setAttribute('contenteditable', false)
    }

    return el
  }

  // overriding the default implementation, to control the behavior
  // for nodes without explicitly registered component
  _getNodeComponentClass (node) {
    let ComponentClass = this.getComponent(node.type, 'not-strict')
    if (ComponentClass) {
      // text components are used directly
      if (node.isText() || this.props.disabled) {
        return ComponentClass
      // other components are wrapped into an IsolatedNodeComponent
      // except the component is itself a customized IsolatedNodeComponent
      } else if (ComponentClass.prototype._isCustomNodeComponent || ComponentClass.prototype._isIsolatedNodeComponent) {
        return ComponentClass
      } else {
        return this.getComponent('isolated-node')
      }
    } else {
      // for text nodes without an component registered explicitly
      // we use the default text component
      if (node.isText()) {
        return this.getComponent('text-node')
      // otherwise component for unsupported nodes
      } else {
        return this.getComponent('unsupported')
      }
    }
  }

  _getNodeProps (node) {
    let props = super._getNodeProps(node)
    let model = this.context.api.getModelById(node.id)
    props.model = model
    return props
  }
}

function _monkeyPatchSurfaceProps (parent, props) {
  let newProps = Object.assign({}, props)
  if (props.model && !props.node) {
    const model = props.model
    if (model.type === 'flow-content-model') {
      newProps.containerId = model.id
    } else {
      newProps.node = model._node
    }
  }
  // TODO: we should revisit this in Substance
  if (props.editable === false || !parent.context.editable) {
    newProps.editing = 'readonly'
  }
  return newProps
}

export class IsolatedInlineNodeComponentNew extends SubstanceIsolatedInlineNodeComponent {
  constructor (parent, props, options) {
    super(parent, props, options)
    if (!props.model) throw new Error("Property 'model' is required and must be a NodeModel")
    if (!props.model._node) throw new Error('Provided model must container a DocumentNode')
  }
  _getContentProps () {
    let props = super._getContentProps()
    props.model = this.props.model
    return props
  }
}

export class IsolatedNodeComponentNew extends SubstanceIsolatedNodeComponent {
  constructor (parent, props, options) {
    super(parent, props, options)
    if (!props.model) throw new Error("Property 'model' is required and must be a NodeModel")
    if (!props.model._node) throw new Error('Provided model must container a DocumentNode')

    // HACK: overriding 'closed' IsolatedNodeComponents per se
    // TODO: on the long term we need to understand if it may be better to open
    // IsolatedNodes by default and only close them if needed.
    // The UX is improved much also in browsers like FF.
    // Still we need to evaluate this decision in the near future.
    this.blockingMode = 'open'
  }

  _getContentProps () {
    let props = super._getContentProps()
    props.model = this.props.model
    return props
  }

  // overriding the core implementation to select the node on all unhandled clicks.
  onClick (event) {
    event.stopPropagation()
    event.preventDefault()
    this.selectNode()
  }
}
/*
  Overriding the original implementation
  - 1. to be able to pass down Model instances to inline nodes and annotations
  - 2. to change the way how place-holders are rendered
*/
export class TextPropertyComponentNew extends SubstanceTextPropertyComponent {
  render ($$) {
    let path = this.getPath()

    let el = this._renderContent($$)
      .addClass('sc-text-property')
      .attr({
        'data-path': path.join('.')
      })
      .css({
        'white-space': 'pre-wrap'
      })

    if (this.isEmpty()) {
      el.addClass('sm-empty')
      if (this.props.placeholder) {
        el.setAttribute('data-placeholder', this.props.placeholder)
      }
    }

    if (!this.props.withoutBreak) {
      el.append($$('br'))
    }

    return el
  }

  _getFragmentProps (node) {
    let props = super._getFragmentProps(node)
    let model = this.context.api.getModelById(node.id)
    props.model = model
    return props
  }

  _getUnsupportedInlineNodeComponentClass () {
    return this.getComponent('unsupported-inline-node')
  }
}

function ModifiedSurface (Surface) {
  class _ModifiedSurface extends Surface {
    constructor (parent, props, options) {
      super(parent, _monkeyPatchSurfaceProps(parent, props), options)
    }

    didMount () {
      const surfaceManager = this.getSurfaceManager()
      if (surfaceManager && this.isEditable()) {
        surfaceManager.registerSurface(this)
      }
      const globalEventHandler = this.getGlobalEventHandler()
      if (globalEventHandler) {
        globalEventHandler.addEventListener('keydown', this._muteNativeHandlers, this)
      }
    }

    dispose () {
      const surfaceManager = this.getSurfaceManager()
      if (surfaceManager && this.isEditable()) {
        surfaceManager.unregisterSurface(this)
      }
      const globalEventHandler = this.getGlobalEventHandler()
      if (globalEventHandler) {
        globalEventHandler.removeEventListener('keydown', this._muteNativeHandlers)
      }
    }

    setProps (newProps) {
      return super.setProps(_monkeyPatchSurfaceProps(this.parent, newProps))
    }

    render ($$) {
      // NOTE: experimenting with additional event handlers
      // After we are sure that we want this we should add this to the core implementation
      let el = super.render($$)
      if (!this.isDisabled()) {
        if (!this.isReadonly()) {
          // Mouse Events
          el.on('click', this.onClick)
        }
      }
      return el
    }

    _initializeClipboard () {
      return new ClipboardNew()
    }

    _onCopy (e) {
      e.preventDefault()
      e.stopPropagation()
      let clipboardData = e.clipboardData
      this.clipboard.copy(clipboardData, this.context)
    }

    _onCut (e) {
      e.preventDefault()
      e.stopPropagation()
      let clipboardData = e.clipboardData
      this.clipboard.cut(clipboardData, this.context)
    }

    _onPaste (e) {
      e.preventDefault()
      e.stopPropagation()
      let clipboardData = e.clipboardData
      // TODO: allow to force plain-text paste
      this.clipboard.paste(clipboardData, this.context)
    }

    // mostly copied from 'Substance.Surface.onMouseDown()'
    // trying to improve the mouse handling
    // not letting bubble up handled events
    onMouseDown (event) {
      if (!this._shouldConsumeEvent(event)) {
        // console.log('skipping mousedown', this.id)
        return false
      }
      // stopping propagation because now the event is considered to be handled
      event.stopPropagation()

      // EXPERIMENTAL: trying to 'reserve' a mousedown event
      // so that parents know that they shouldn't react
      // This is similar to event.stopPropagation() but without
      // side-effects.
      // Note: some browsers do not do clicks, selections etc. on children if propagation is stopped
      if (event.__reserved__) {
        // console.log('%s: mousedown already reserved by %s', this.id, event.__reserved__.id)
        return
      } else {
        // console.log('%s: taking mousedown ', this.id)
        event.__reserved__ = this
      }

      // NOTE: this is here to make sure that this surface is contenteditable
      // For instance, IsolatedNodeComponent sets contenteditable=false on this element
      // to achieve selection isolation
      if (this.isEditable()) {
        this.el.setAttribute('contenteditable', true)
      }

      // TODO: what is this exactly?
      if (event.button !== 0) {
        return
      }

      // special treatment for triple clicks
      if (!(platform.isIE && platform.version < 12) && event.detail >= 3) {
        let sel = this.getEditorSession().getSelection()
        if (sel.isPropertySelection()) {
          this._selectProperty(sel.path)
          event.preventDefault()
          event.stopPropagation()
          return
        } else if (sel.isContainerSelection()) {
          this._selectProperty(sel.startPath)
          event.preventDefault()
          event.stopPropagation()
          return
        }
      }
      // 'mouseDown' is triggered before 'focus' so we tell
      // our focus handler that we are already dealing with it
      // The opposite situation, when the surface gets focused e.g. using keyboard
      // then the handler needs to kick in and recover a persisted selection or such
      this._state.skipNextFocusEvent = true

      // this is important for the regular use case, where the mousup occurs within this component
      this.el.on('mouseup', this.onMouseUp, this)
      // NOTE: additionally we need to listen to mousup on document to catch events outside the surface
      // TODO: it could still be possible not to receive this event, if mouseup is triggered on a component that consumes the event
      if (platform.inBrowser) {
        let documentEl = DefaultDOMElement.wrapNativeElement(window.document)
        documentEl.on('mouseup', this.onMouseUp, this)
      }
    }

    onMouseUp (e) {
      // console.log('Surface.onMouseUp', this.id)
      this.el.off('mouseup', this.onMouseUp, this)
      if (platform.inBrowser) {
        let documentEl = DefaultDOMElement.wrapNativeElement(window.document)
        documentEl.off('mouseup', this.onMouseUp, this)
      }
      // console.log('Surface.onMouseup', this.id);
      // ATTENTION: filtering events does not make sense here,
      // as we need to make sure that pick the selection even
      // when the mouse is released outside the surface
      // if (!this._shouldConsumeEvent(e)) return
      e.stopPropagation()
      // ATTENTION: this delay is necessary for cases the user clicks
      // into an existing selection. In this case the window selection still
      // holds the old value, and is set to the correct selection after this
      // being called.
      this._delayed(() => {
        let sel = this.domSelection.getSelection()
        this._setSelection(sel)
      })
    }

    onClick (event) {
      if (!this._shouldConsumeEvent(event)) {
        // console.log('skipping mousedown', this.id)
        return false
      }
      // stop bubbling up here
      event.stopPropagation()
    }
  }
  return _ModifiedSurface
}
