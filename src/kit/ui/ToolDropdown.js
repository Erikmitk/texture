import ToolGroup from './ToolGroup'
import Tooltip from './Tooltip'

// TODO: use OverlayMixin to avoid code redundancy
export default class ToolDropdown extends ToolGroup {
  constructor (...args) {
    super(...args)

    this._deriveState(this.props)
  }

  didMount () {
    this.context.appState.addObserver(['overlayId'], this.rerender, this, { stage: 'render' })
  }

  dispose () {
    this.context.appState.removeObserver(this)
  }

  willReceiveProps (newProps) {
    this._deriveState(newProps)
  }

  render ($$) {
    let el = $$('div').addClass('sc-tool-dropdown')
    el.addClass('sm-' + this.props.name)

    const appState = this.context.appState
    const commandStates = this.props.commandStates
    const toggleName = this._getToggleLabel()
    const showDisabled = this.props.showDisabled
    const hasEnabledTools = this._hasEnabledTools
    const showChoices = appState.overlayId === this.getId()
    const style = this.props.style
    const theme = this.props.theme

    // Only render this if there are enabled tools
    // except if the user decided to show disabled commands
    if (showDisabled || hasEnabledTools) {
      const Button = this.getComponent('button')
      const Menu = this.getComponent('menu')
      let toggleButtonProps = {
        dropdown: true,
        active: showChoices,
        theme,
        // Note: we are passing the command state allowing to render labels with template strings
        commandState: commandStates[toggleName]
      }
      if (style === 'minimal') {
        toggleButtonProps.icon = toggleName
      } else if (style === 'descriptive') {
        toggleButtonProps.label = toggleName
      } else {
        toggleButtonProps.icon = toggleName
        toggleButtonProps.label = toggleName
      }
      let toggleButton = $$(Button, toggleButtonProps).addClass('se-toggle')
        .on('click', this._toggleChoices)
      el.append(toggleButton)

      if (showChoices) {
        const items = this._getMenuItems()
        el.append(
          $$('div').addClass('se-choices').append(
            $$(Menu, {
              items,
              commandStates
            })
          )
        )
      } else if (style === 'minimal' || toggleName !== this.props.name) {
        // NOTE: tooltips are only rendered when explanation is needed
        el.append(
          this._renderToolTip($$)
        )
      }
    }
    return el
  }

  _renderToolTip ($$) {
    let labelProvider = this.context.labelProvider
    return $$(Tooltip, {
      text: labelProvider.getLabel(this.props.name)
    })
  }

  _deriveState (props) {
    const commandStates = props.commandStates
    const items = props.items
    let activeCommandName
    let hasEnabledTools = false
    this._items = items.map(toolSpec => {
      const commandName = toolSpec.commandName
      let commandState = commandStates[commandName] || { disabled: true }
      if (!activeCommandName && commandState.active) activeCommandName = commandName
      if (!commandState.disabled) hasEnabledTools = true
      return {
        name: commandName,
        toolSpec,
        commandState
      }
    })
    this._activeCommandName = activeCommandName
    this._hasEnabledTools = hasEnabledTools
  }

  /*
    This can be overridden to control the label
  */
  _getToggleLabel () {
    return this._activeCommandName || this.props.name
  }

  _getMenuItems () {
    const showDisabled = this.props.showDisabled
    let menuItems = []
    this._items.forEach(item => {
      // ATTENTION: not showing the disabled ones is violating the users choice
      // given via configuration 'showDisabled'
      if (showDisabled || this.isToolEnabled(item.toolSpec, item.commandState)) {
        menuItems.push({
          commandName: item.name
        })
      }
    })
    return menuItems
  }

  _toggleChoices (event) {
    event.preventDefault()
    event.stopPropagation()
    this.send('toggleOverlay', this.getId())
  }
}
