import {MDCTextField} from '@material/textfield';
import {MDCRipple} from '@material/ripple';
import {MDCList} from '@material/list';

const textField = new MDCTextField(document.querySelector('.username'));
const buttonRippleSignIn = new MDCRipple(document.querySelector('.sign-in'));
const buttonRippleCancel = new MDCRipple(document.querySelector('.cancel'));

const presets = new MDCList(document.querySelector('.preset-list'));
presets.singleSelection = true;

const presetItemRipples = presets.listElements.map((listItemEl) => new MDCRipple(listItemEl));

presets.listen('MDCList:action', ({detail: {index}}) => {
    presets.listElements[index].parentElement.parentElement.submit();
});

window.presets = presets;