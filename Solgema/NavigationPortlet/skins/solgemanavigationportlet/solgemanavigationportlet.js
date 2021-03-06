function initjScrollPane(portlet) {
    var item = $(portlet).find('.portletNavigationTree');
    if (!item.is('section')) {
        var item = $(portlet).find('.portletNavigationTree .portletItem');
    }
    item.css({'height': 'auto', 'position':'relative'});
    var maxHeight = $(portlet).css('max-height');
    if (maxHeight & maxHeight!='none') {
        var navTreeMaxHeight = maxHeight.replace('px', '');
    } else {
        var navTreeMaxHeight = 600;
    }
    if ( item.height() > navTreeMaxHeight ) {
        item.css({'height': navTreeMaxHeight+'px', 'position':'relative'});
        item.jScrollPane();
        var container = $(portlet).find('.jspContainer');
        container.css('height', navTreeMaxHeight+'px');
        var current = $(portlet).find('.portletNavigationTree .portletItem a.navTreeCurrentNode');
        if ( current.length!=0 ) {
            item.data('jsp').scrollToElement(current, true);
        }
    }
};

function updateScrollPane() {
    var portlet = $(this).parents('.SolgemaNavigationPortlet.useScrollPane');
    var item = $(portlet).find('.portletNavigationTree');
    if (!item.is('section')) {
        var item = $(portlet).find('.portletNavigationTree .portletItem');
    }
    item.css({'height': 'auto', 'position':'relative'});
    var maxHeight = $(portlet).css('max-height');
    if (maxHeight & maxHeight!='none') {
        var navTreeMaxHeight = maxHeight.replace('px', '');
    } else {
        var navTreeMaxHeight = 600;
    }
    if ( item.height() > navTreeMaxHeight ) item.css({'height': navTreeMaxHeight+'px', 'position':'relative'});
    var container = $(portlet).find('.jspContainer');
    if (container.length==0) {
        initjScrollPane(portlet);
        var jspAPI = item.data('jsp');
    } else {
        var jspAPI = item.data('jsp');
        if (jspAPI) jspAPI.reinitialise();
    }
    console.debug(item);
    console.debug(item.height());
    console.debug(navTreeMaxHeight);
    if ( item.height() >= navTreeMaxHeight ) {
        container.css('height', navTreeMaxHeight+'px');
    } else {
        container.css('height', 'auto');
    }
    if (jspAPI) jspAPI.scrollToElement($(this), true);
};

function toggleNavtree(portlet, link, container) {
    if (container.hasClass('navTreeClosed')) {
        container.find('ul:first').slideToggle(400, updateScrollPane);
        container.removeClass('navTreeClosed').addClass('navTreeOpen');
        link.removeClass('navTreeClosed').addClass('navTreeOpen');
        var item = $(portlet).find('.portletNavigationTree .portletItem');
    } else {
        container.find('ul:first').slideToggle(400, updateScrollPane);
        container.removeClass('navTreeOpen').addClass('navTreeClosed');
        link.removeClass('navTreeOpen').addClass('navTreeClosed');
    }
};

function navtreeCollapsible(event) {
    if (event.which = 1) {
        if ( event.pageX > $(this).find('span:last').offset().left ) return true;
        event.preventDefault();
        var portletWrapper = $(this).parents('.portletWrapper:first');
        var portlet = $(this).parents('.SolgemaNavigationPortlet:first');
        var portletDL = $(this).parents('section:first');
        if (typeof portletDL === undefined) {
            var portletDL = $(this).parents('dl:first');
        }
        var classes = portletWrapper.attr('class').split(' ');
        for (i = 0; i < classes.length; i++) {
            if ( classes[i].match('kssattr-portlethash-') ) var navTreeHash = classes[i].replace('kssattr-portlethash-', '');
        }
        if (portletWrapper.attr('data-portlethash')!== undefined) {
            var navTreeHash = portletWrapper.attr('data-portlethash');
        }
        var link = $(this);
        var container = $(this).parents('li.navTreeFolderish:first');
        if (container.length==0) return true;
        var innercontainer = $(this).parents('.outer_section:first');
        if (innercontainer.length==0) var innercontainer = container;
        var content = innercontainer.children('ul.navTree:first');
        if (content.length==0) {
            $('#kss-spinner').show();
            $('.plone-loader').show();
            var classes = $(this).attr('class').split(' ');
            for (i = 0; i < classes.length; i++) {
                if ( classes[i].match('navtreepath-') ) var navTreePath = classes[i].replace('navtreepath-', '');
                if ( classes[i].match('navtreelevel-') ) var navTreeLevel = classes[i].replace('navtreelevel-', '');
            }
            if (typeof portal_url == 'undefined') {
                portal_url = $('body').attr('data-portal-url');
            }
            $.get(portal_url+"/@@navTreeItem", { portlethash: navTreeHash, navtreepath: navTreePath, navtreelevel: navTreeLevel },
                function (data) {
                    if (data) {
                        var d = document.createElement('div');
                        $(d).html(data);
                        var final = $(d).find('ul').detach();
                        innercontainer.append(final);
                        innercontainer.find('a.navTreeText').unbind('click');
                        if ($(portletDL).hasClass('contextMenuEnabled')) {
                            try {
                                innercontainer.find('a.navTreeText').bind("contextmenu", openContextualContentMenu);
                            } catch(err) {}
                        }
                        innercontainer.find('a.navTreeText').click(navtreeCollapsible).end().each(function() {
                            var container = $(this).parents('li.navTreeFolderish:first');
                            var state = container.hasClass('navTreeClosed') ? 'collapsed' : 'expanded';
                            if (state =='collapsed') container.find('ul').css('display','none');
                            toggleNavtree(portlet, link, container);
                            $('#kss-spinner').css('display','none');
                            $('.plone-loader').hide();
                        });
                    } else {
                        if (container.hasClass('navTreeClosed')) {
                            container.removeClass('navTreeClosed').addClass('navTreeOpen');
                            link.removeClass('navTreeClosed').addClass('navTreeOpen');
                        } else {
                            container.removeClass('navTreeOpen').addClass('navTreeClosed');
                            link.removeClass('navTreeOpen').addClass('navTreeClosed');
                        }
                    $('#kss-spinner').css('display','none');
                    $('.plone-loader').hide();
                    }
                }
            );
        } else {
            toggleNavtree(portlet, link, container);
        }
    } else if (event.which = 3) {
        return false;
        $('a.navTreeText').removeClass('selected');
        $(this).addClass('selected');
    }
};

function activateNavtreeCollapsibles() {
    var portlet = $('.SolgemaNavigationPortlet.useScrollPane');
    initjScrollPane(portlet);
    $('.SolgemaNavigationPortlet.useScrollPane .portletNavigationTree').addClass('javaNavTree');
    $('.SolgemaNavigationPortlet.useScrollPane li.navTreeFolderish').find('a.navTreeText:first').click(navtreeCollapsible).end().each(function() {
        var container = $(this).parents('li.navTreeFolderish:first');
        var state = container.hasClass('navTreeClosed') ?
                     'collapsed' : 'expanded';
        if (state =='collapsed') container.find('ul').css('display','none');

    });
};

$(activateNavtreeCollapsibles);

