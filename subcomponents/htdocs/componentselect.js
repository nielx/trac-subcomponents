/*
 * Copyright 2006, John Drinkwater <john@nextraweb.com>
 * Distributed under the terms of the MIT License.
 * Please note, this script isn't as DOM friendly as I would like, 
 * but IE, as always, has problems with <select> and <option>s
 * Version 1j, from http://ezri.nextraweb.com/examples/js/haiku/rev1j/componentselect.js
 * Thanks to wkornew & tic
 */

/*
 * Rewritten & maintained by Niels Sascha Reedijk <niels.reedijk@gmail.com>
 * Copyright 2012-2021.
*/


function getLeafsForLevel(level, prefix, forceEmptyLeafs) {
    let retVal = [];
    let previous = null;

    for (let i = 0; i < gComponentList.length; i++) {
        // Check if the current item has the right prefix
        if (gComponentList[i].join('/').substring(0, prefix.length) !== prefix) {
            continue;
        }

        let current = gComponentList[i][level];
        if (!current) {
            // This item has the right prefix, but no value. This means that
            // it is an empty leaf
            current = "";
        }

        if (current === previous)
        // this item is already in the list
            continue;

        retVal.push(current);
        previous = current;
    }

    if (retVal.length === 0 || (retVal.length === 1 && retVal[0] === ""))
    // There are no entries, or the only entry is an empty leaf
        return [];

    if (forceEmptyLeafs && retVal[0] !== "")
        retVal.unshift("")

    return retVal;
}

/*
	Event handler for when the user has changed the selected component
 */
function selectedComponentChanged(e) {
    // Get the level of this select
    let level = jQuery(this).prevAll('[class=haikucomponent]').length + 1;

    // Hide the deeper subcomponents (if applicable)
    jQuery(this).nextAll('[class=haikucomponent]').hide();

    // Check if the current selected value is an empty leaf
    if (jQuery(this).val().length === 0) {
        let prefix = ""
        jQuery(this).prevAll('[class=haikucomponent]').reverse()
            .each(function () {
                if (prefix.length !== 0)
                    prefix += "/"
                prefix += jQuery(this).val();
            });
        // Store the path of the previous leafs and end
        jQuery(this).parent().find("input[type=hidden]").val(prefix);
        return;
    }

    // Just store the new path if this is the 'highest' level
    if (level === gMaxBranches) {
        let prefix = ""
        jQuery(this).parent().find('[class=haikucomponent]').each(function () {
            if (prefix.length !== 0)
                prefix += "/";
            prefix += jQuery(this).val();
        });
        jQuery(this).parent().find("input[type=hidden]").val(prefix);
        return;
    }

    // Empty the next selects
    jQuery(this).nextAll('[class=haikucomponent]').empty();

    // Fill the next selects with the right options. Sometimes that only means
    // that the next select is filled, at other times, we have to go deeper,
    // for example when there are no empty leaves for a subcomponent.

    let prefix = "";
    jQuery(this).prevAll('[class=haikucomponent]').reverse().each(function () {
        prefix += jQuery(this).val();
        prefix += "/";
    });
    prefix += jQuery(this).val();

    let currentSelector = jQuery(this);
    for (let i = level; i < gMaxBranches; i++) {
        let items = getLeafsForLevel(i, prefix, e.data.forceEmptyLeafs);

        for (let j = 0; j < items.length; j++)
            currentSelector.next().append(jQuery("<option/>", {
                value: items[j],
                text: items[j]
            }));

        // If there are any entries in the select to the right, show it
        // otherwise break out of the loop as we are done
        if (items.length)
            currentSelector.next().show();
        else
            break;

        // If the next selector has an empty leaf, then we are done. Otherwise
        // go deeper
        if (items[0] === "")
            break;

        prefix += "/"
        prefix += items[0]
        currentSelector = currentSelector.next()
    }

    // Update the current selected value. The prefix string has the complete
    // path of the current selection
    jQuery(this).parent().find("input[type=hidden]").val(prefix);
}


/*
	This function deletes the <select> box, replaces it with a hidden input 
	box, and as many <select>s as the first/selected component had parts: this
	new element has an  event that triggers on change, to add or remove 
	<select> boxes
	original: the <select> field that is to be replaced
	set: support multiple component fields, can leave null for autoincrement
	forceEmptyLeafs: add leafs that contain '', so users can pick super components
	                 used in the Query
*/
function convertComponentSelect(element, forceEmptyLeafs) {
    let e = jQuery(element);
    let parent = jQuery(element).parent();

    gComponentCount++;

    // Populate the global component list if it has not been populated before
    if (gComponentList.length === 0) {
        let i = 0;
        e.find('option').each(function () {
            // Trac 1.4 adds newlines to the options on the query.html template, so trim() the entries
            gComponentList[i] = jQuery(this).text().trim().split('/');
            gMaxBranches = (gMaxBranches < gComponentList[i].length ? gComponentList[i].length : gMaxBranches);
            i++;
        });

        gComponentList.sort(); // so Trac can be lazy
    }

    // create some replacement dropdowns
    for (let i = 1; i <= gMaxBranches; i++) {
        parent.append(jQuery(document.createElement('select'))
            .attr('id', 'component-selector' + gComponentCount + '-' + i)
            .attr('class', 'haikucomponent')
            .change({forceEmptyLeafs: forceEmptyLeafs}, selectedComponentChanged));
    }

    // Store the current selected item
    let currentItems = e.val().split('/');
    let currentSelectors = parent.find('[class=haikucomponent]');
    let prefix = "";

    // Populate choice(s)
    // Note: always use currentItems.length + 1 because we want to check
    // whether there are more subselections possible
    for (let i = 0; i < currentItems.length + 1; i++) {
        let items = getLeafsForLevel(i, prefix, forceEmptyLeafs);

        for (let j = 0; j < items.length; j++) {
            jQuery(currentSelectors[i]).append(jQuery("<option/>", {
                value: items[j],
                text: items[j]
            }));
        }

        if (items.length === 0) {
            break;
        }

        jQuery(currentSelectors[i]).val(currentItems[i]);

        // Add the current selected item to the prefix to prepare for the next
        // level
        if (prefix.length !== 0)
            prefix += "/";
        if (currentItems[i] === "")
        // In case we have an 'emtpy' value, we only need to go once to get
        // the toplevel
            break;
        prefix += currentItems[i];
    }

    // Hide the unused inputs
    jQuery(currentSelectors[currentItems.length]).nextAll().hide();

    // Hide the highest input if there are no options
    if (jQuery(currentSelectors[currentItems.length]).children().length === 0)
        jQuery(currentSelectors[currentItems.length]).hide();

    // Replace the current selector with a hidden input field
    e.replaceWith(
        $(document.createElement('input'))
            .attr('id', e.attr('id'))
            .attr('name', e.attr('name'))
            .attr('value', e.val())
            .attr('type', "hidden")
    );
}

window.gComponentList = [];
window.gMaxBranches = 0;
window.gComponentCount = 0;

function addRenameChildrenCheckbox() {
    const element = jQuery('<div class="field"><label><input name="renamechildren" id="renamechildren" type="checkbox" checked="checked"/>&nbsp;Also rename children</label></div>');
    element.insertAfter(jQuery('div.field')[1]);
}

// This function creates a MutationObserver that will catch all newly created filters
// on the query page, as well as the component property of the batch modify functionality,
// and converts the component filter into a subcomponent list
function monitorQueryPageComponents() {
    // Create an observer instance
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            let newNodes = mutation.addedNodes; // DOM NodeList
            if (newNodes !== null) { // If there are new nodes added
                let selectNodes = jQuery(newNodes).find('select'); // jQuery set
                selectNodes.each(function () {
                    // query filters
                    if (this.name.match(/[0-9]+_component$/g))
                        convertComponentSelect(this, true)
                    // batch modify component
                    else if (this.name === "batchmod_value_component")
                        convertComponentSelect(this, false)
                });
            }
        });
    });

    // For the filter, we need to observe not only the direct children, but also the subtree below those children.
    // The reason is that if the Component filter is added for the first time, it creates a direct
    // new `tbody`, but if an additional component filter is added (creating an or clause), it creates
    // a `tr` within that tbody. We also want to capture those.
    observer.observe(jQuery('table.trac-clause')[0], {childList: true, subtree: true});
    observer.observe(jQuery('fieldset#batchmod_fieldset')[0], {childList: true, subtree: true});
}


function initialiseComponents() {
    // Query page: use the existence of the add_filter_* element to detect we are on the query
    // page, and set up some code for that. This also monitors for when the batch modify function
    // is used to modify the component.
    if (jQuery('[id^=add_filter_]').length)
        monitorQueryPageComponents();

    // Query page: existing filters
    jQuery('tr.component td.filter select').each(function () {
        convertComponentSelect(this, true)
    });

    // Ticket/Newticket page: component field
    // Original comment: Opera picks up .names in getElementById(), hence it being at the end now
    let $field_component = jQuery('#field-component')
    if ($field_component.length) {
        convertComponentSelect($field_component[0], false); // For the new ticket page
    }
    // Component Admin: add the [ ] rename children checkbox when applicable
    if (typeof rename_children !== 'undefined' && rename_children)
        addRenameChildrenCheckbox();

    // Add the reverse function to jQuery, used by convertComponentSelect()
    jQuery.fn.reverse = [].reverse;
}

jQuery(document).ready(initialiseComponents);
