import { NodeComponent } from 'substance'
import entityRenderers from '../../entities/entityRenderers'
import ModalDialog from '../../shared/ModalDialog'
import EditRelationship from '../../entities/EditRelationship'
import updateEntityChildArray from '../../util/updateEntityChildArray'


export default class ContribsListComponent extends NodeComponent {

  didMount() {
    super.didMount()
    this.handleActions({
      'done': this._doneEditing,
      'cancel': this._doneEditing,
      'closeModal': this._doneEditing,
      'entitiesSelected': this._updateContribs
    })
  }

  getInitialState() {
    return {
      edit: false
    }
  }

  _getEntityIds() {
    return this.props.node.findAll('contrib').map(contrib => contrib.getAttribute('rid'))
  }

  render($$) {
    const entityIds = this._getEntityIds()
    let labelProvider = this.context.labelProvider
    let db = this.context.pubMetaDbSession.getDocument()
    let el = $$('div').addClass(this.getClassNames())

    if (this.state.edit) {
      var modal = $$(ModalDialog, {
        width: 'medium',
        textAlign: 'center'
      })
      modal.append(
        $$(EditRelationship, {
          propertyName: this.getPropertyName(),
          entityIds: this._getEntityIds(),
          targetTypes: this.getTargetTypes()
        })
      )
      el.append(modal)
    }

    if (entityIds.length > 0) {
      let contentEl = $$('div').addClass('se-content')
      entityIds.forEach((entityId, index) => {
        let entity = db.get(entityId)
        if (!entity) {
          console.error('FIXME: no entity for contrib', entityId)
        } else {
          let short = entity.type === 'organisation'
          contentEl.append(
            $$('span').addClass('se-contrib').html(
              entityRenderers[entity.type](entity.id, db, { short })
            )
          )
          if (index < entityIds.length - 1) {
            contentEl.append(', ')
          }
        }
      })
      el.append(contentEl)
    }

    // el.append(
    //   $$('button').addClass('sc-button sm-style-big').append(
    //     'Edit ',
    //     labelProvider.getLabel(this.getPropertyName())
    //   ).on('click', this._editContribs)
    // )
    return el
  }

  _editContribs() {
    this.setState({
      edit: true
    })
  }

  _doneEditing() {
    this.setState({
      edit: false
    })
  }

  _updateContribs(entityIds) {
    let oldEntityIds = this._getEntityIds()
    updateEntityChildArray(this.context.editorSession, this.props.node.id, 'contrib', 'rid', oldEntityIds, entityIds)
    this.setState({
      edit: false
    })
  }

}
