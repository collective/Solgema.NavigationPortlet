function initjScrollPane(portlet) {
    var item = jq(portlet).find('dl.portletNavigationTree dd.portletItem');
    item.css({'height': 'auto', 'position':'relative'});
    var maxHeight = jq(portlet).css('max-height');
    if (maxHeight) {
        var navTreeMaxHeight = maxHeight.replace('px', '');
    } else {
        var navTreeMaxHeight = 600;
    }
    if ( item.height() > navTreeMaxHeight ) {
        item.css({'height': navTreeMaxHeight+'px', 'position':'relative'});
        item.jScrollPane();
        var container = jq(portlet).find('.jspContainer');
        container.css('height', navTreeMaxHeight+'px');
        var current = jq(portlet).find('dl.portletNavigationTree dd.portletItem a.navTreeCurrentNode');
        if ( current.length!=0 ) {
            jq(portlet).find('dl.portletNavigationTree dd.portletItem').data('jsp').scrollToElement(current, true);
        }
    }
};

function updateScrollPane() {
    var portlet = jq(this).parents('.SolgemaNavigationPortlet.useScrollPane');
    var item = jq(portlet).find('dl.portletNavigationTree dd.portletItem');
    item.css({'height': 'auto', 'position':'relative'});
    var maxHeight = jq(portlet).css('max-height');
    if (maxHeight) {
        var navTreeMaxHeight = maxHeight.replace('px', '');
    } else {
        var navTreeMaxHeight = 600;
    }
    if ( item.height() > navTreeMaxHeight ) item.css({'height': navTreeMaxHeight+'px', 'position':'relative'});
    var container = jq(portlet).find('.jspContainer');
    if (container.length==0) {
        initjScrollPane(portlet);
        var jspAPI = jq(portlet).find('dl.portletNavigationTree dd.portletItem').data('jsp');
    } else {
        var jspAPI = jq(portlet).find('dl.portletNavigationTree dd.portletItem').data('jsp');
        if (jspAPI) jspAPI.reinitialise();
    }
    if ( item.height() > navTreeMaxHeight ) {
        container.css('height', navTreeMaxHeight+'px');
    } else {
        container.css('height', 'auto');
    }
    if (jspAPI) jspAPI.scrollToElement(jq(this), true);
};

function toggleNavtree(portlet, link, container) {
    if (container.hasClass('navTreeClosed')) {
        container.find('ul:first').slideToggle(400, updateScrollPane);
        container.removeClass('navTreeClosed').addClass('navTreeOpen');
        link.removeClass('navTreeClosed').addClass('navTreeOpen');
        var item = jq(portlet).find('dl.portletNavigationTree dd.portletItem');
    } else {
        container.find('ul:first').slideToggle(400, updateScrollPane);
        container.removeClass('navTreeOpen').addClass('navTreeClosed');
        link.removeClass('navTreeOpen').addClass('navTreeClosed');
    }
};

function navtreeCollapsible(event) {
    if (event.which = 1) {
        if ( event.pageX > jq(this).find('span:last').offset().left ) return true;
        event.preventDefault();
        var portletWrapper = jq(this).parents('div.portletWrapper:first');
        var portlet = jq(this).parents('div.SolgemaNavigationPortlet:first');
        var portletDL = jq(this).parents('dl:first');
        var classes = portletWrapper.attr('class').split(' ');
        for (i = 0; i < classes.length; i++) {
            if ( classes[i].match('kssattr-portlethash-') ) var navTreeHash = classes[i].replace('kssattr-portlethash-', '');
        }
        var link = jq(this);
        var container = jq(this).parents('li.navTreeFolderish:first');
        if (container.length==0) return true;
        var innercontainer = jq(this).parents('.outer_section:first');
        var content = innercontainer.children('ul.navTree:first');
        if (content.length==0) {
            jq('#kss-spinner').show();
            var classes = jq(this).attr('class').split(' ');
            for (i = 0; i < classes.length; i++) {
                if ( classes[i].match('navtreepath-') ) var navTreePath = classes[i].replace('navtreepath-', '');
                if ( classes[i].match('navtreelevel-') ) var navTreeLevel = classes[i].replace('navtreelevel-', '');
            }

            jq.get("@@navTreeItem", { portlethash: navTreeHash, navtreepath: navTreePath, navtreelevel: navTreeLevel },
                function (data) {
                    if (data) {
                        innercontainer.append(data);
                        innercontainer.find('a.navTreeText').unbind('click');
                        if (jq(portletDL).hasClass('dropDownEnabled')) {
                            try {
                                innercontainer.find('a.navTreeText').bind("contextmenu", openContextualContentMenu);
                            } catch(err) {}
                        }
                        innercontainer.find('a.navTreeText').click(navtreeCollapsible).end().each(function() {
                            var container = jq(this).parents('li.navTreeFolderish:first');
                            var state = container.hasClass('navTreeClosed') ? 'collapsed' : 'expanded';
                            if (state =='collapsed') container.find('ul').css('display','none');
                            toggleNavtree(portlet, link, container);
                            jq('#kss-spinner').css('display','none');
                        });
                    } else {
                        if (container.hasClass('navTreeClosed')) {
                            container.removeClass('navTreeClosed').addClass('navTreeOpen');
                            link.removeClass('navTreeClosed').addClass('navTreeOpen');
                        } else {
                            container.removeClass('navTreeOpen').addClass('navTreeClosed');
                            link.removeClass('navTreeOpen').addClass('navTreeClosed');
                        }
                    jq('#kss-spinner').css('display','none');
                    }
                }
            );
        } else {
            toggleNavtree(portlet, link, container);
        }
    } else if (event.which = 3) {
        return false;
        jq('a.navTreeText').removeClass('selected');
        jq(this).addClass('selected');
    }
};

function activateNavtreeCollapsibles() {
    var portlet = jq('.SolgemaNavigationPortlet.useScrollPane');
    initjScrollPane(portlet);
    jq('.SolgemaNavigationPortlet.useScrollPane dl.portletNavigationTree').addClass('javaNavTree');
    jq('.SolgemaNavigationPortlet.useScrollPane li.navTreeFolderish').find('a.navTreeText:first').click(navtreeCollapsible).end().each(function() {
        var container = jq(this).parents('li.navTreeFolderish:first');
        var state = container.hasClass('navTreeClosed') ?
                     'collapsed' : 'expanded';
        if (state =='collapsed') container.find('ul').css('display','none');

    });
};

jq(activateNavtreeCollapsibles);

