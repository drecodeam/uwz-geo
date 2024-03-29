/**
 * Object that represents the Details (step 2) portion of the UploadWizard
 * n.b. each upload gets its own details.
 *
 * XXX a lot of this construction is not really the jQuery way.
 * The correct thing would be to have some hidden static HTML
 * on the page which we clone and slice up with selectors. Inputs can still be members of the object
 * but they'll be found by selectors, not by creating them as members and then adding them to a DOM structure.
 *
 * @param UploadWizardUpload
 * @param API
 * @param containerDiv	The div to put the interface into
 */
( function( mw, $j, undefined ) {

var fileNsId = mw.config.get( 'wgNamespaceIds' ).file;

mw.UploadWizardDetails = function( upload, api, containerDiv ) {
	console.log('uploadwizarddetails constructor called');
	var _this = this;
	_this.upload = upload;
	_this.containerDiv = containerDiv;
	_this.api = api;

	_this.descriptions = [];

	_this.div = $j( '<div class="mwe-upwiz-info-file ui-helper-clearfix filled"></div>' );

	_this.thumbnailContainerDiv = $j( '<div class="mwe-upwiz-thumbnail mwe-upwiz-thumbnail-side"></div>' );
	_this.thumbnailDiv = $j( '<div></div>' );
	_this.thumbnailContainerDiv.append( _this.thumbnailDiv );

	_this.removeButton = $j( '<button class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only"><span class="ui-button-text">Remove file</span></button>' );
	_this.removeButton.click( function () {
		_this.upload.remove();
	});
	_this.thumbnailContainerDiv.append( _this.removeButton );

	_this.dataDiv = $j( '<div class="mwe-upwiz-data"></div>' );

	// descriptions
	_this.descriptionsDiv = $j( '<div class="mwe-upwiz-details-descriptions"></div>' );

	_this.descriptionAdder = $j( '<a class="mwe-upwiz-more-options"/>' )
					.html( gM( 'mwe-upwiz-desc-add-0' ) )
					.click( function( ) { _this.addDescription(); } );

	var descriptionAdderDiv =
		$j( '<div />' ).append(
			$j( '<div class="mwe-upwiz-details-fieldname" />' ),
			$j( '<div class="mwe-upwiz-details-descriptions-add" />' )
					.append( _this.descriptionAdder )
		);

	// Commons specific help for titles
	//    http://commons.wikimedia.org/wiki/Commons:File_naming
	//    http://commons.wikimedia.org/wiki/MediaWiki:Filename-prefix-blacklist
	//    XXX make sure they can't use ctrl characters or returns or any other bad stuff.
	_this.titleId = "title" + _this.upload.index;
	_this.titleInput = $j( '<input type="text" id="' + _this.titleId + '" name="' + _this.titleId + '" class="mwe-title" maxlength="250"/>' )
		.keyup( function() {
			_this.setCleanTitle( $( _this.titleInput ).val() );
		} )
		.destinationChecked( {
			api: _this.upload.api,
			spinner: function(bool) { _this.toggleDestinationBusy(bool); },
			preprocess: function( name ) {
				if ( name !== '' ) {
					// turn the contents of the input into a MediaWiki title ("File:foo_bar.jpg") to look up
					// side effect -- also sets this as our current title
					return _this.setCleanTitle( name ).toString();
				} else {
					return name;
				}
			},
			processResult: function( result ) { _this.processDestinationCheck( result ); }
		} );

	_this.titleErrorDiv = $j('<div class="mwe-upwiz-details-input-error">'
					+ '<label class="mwe-error mwe-validator-error" for="' + _this.titleId + '" generated="true"/>'
					+ '<label class="mwe-error errorTitleUnique" for="' + _this.titleId + '" generated="true"/>'
					+ '<label class="mwe-error errorRecovery" for="' + _this.titleId + '" generated="true"/>'
				+ '</div>');

	var titleContainerDiv = $j('<div class="mwe-upwiz-details-fieldname-input ui-helper-clearfix"></div>')
		.append(
			_this.titleErrorDiv,
			$j( '<div class="mwe-upwiz-details-fieldname"></div>' )
				.msg( 'mwe-upwiz-title' )
				.requiredFieldLabel()
				.addHint( 'title' ),
			$j( '<div class="mwe-upwiz-details-input"></div>' ).append( _this.titleInput )
		);

	_this.deedDiv = $j( '<div class="mwe-upwiz-custom-deed" />' );

	_this.copyrightInfoFieldset = $j('<fieldset class="mwe-fieldset mwe-upwiz-copyright-info"></fieldset>')
		.hide()
		.append(
			$j( '<legend class="mwe-legend">' ).append( gM( 'mwe-upwiz-copyright-info' ) ),
			_this.deedDiv
		);

	var $categoriesDiv = $j('<div class="mwe-upwiz-details-fieldname-input ui-helper-clearfix">'
				+ '<div class="mwe-upwiz-details-fieldname"></div>'
				+ '<div class="mwe-upwiz-details-input"></div>'
				+ '</div>' );
	var commonsCategoriesLink = $j( '<a>' ).attr( { 'target': '_blank', 'href': 'http://commons.wikimedia.org/wiki/Commons:Categories' } );
	var categoriesHint = $j( '<span>' ).msg( 'mwe-upwiz-tooltip-categories', commonsCategoriesLink ).html();
	var categoriesHinter = function() { return categoriesHint; };
	$categoriesDiv
		.find( '.mwe-upwiz-details-fieldname' )
		.append( gM( 'mwe-upwiz-categories' ) )
		.addHint( 'mwe-upwiz-categories-hint', categoriesHinter );
	var categoriesId = 'categories' + _this.upload.index;
	$categoriesDiv.find( '.mwe-upwiz-details-input' )
		.append( $j( '<input/>' ).attr( { id: categoriesId,
						  name: categoriesId,
						  type: 'text' } )
		);

	var dateInputId = "dateInput" + ( _this.upload.index ).toString();

	var dateErrorDiv = $j('<div class="mwe-upwiz-details-input-error"><label class="mwe-validator-error" for="' + dateInputId + '" generated="true"/></div>');

	/* XXX must localize this by loading jquery.ui.datepicker-XX.js where XX is a language code */
	/* jQuery.ui.datepicker also modifies first-day-of-week according to language, which is somewhat wrong. */
	/* $.datepicker.setDefaults() for other settings */
	_this.dateInput =
		$j( '<input type="text" id="' + dateInputId + '" name="' + dateInputId + '" type="text" class="mwe-date" size="20"/>' );

	var dateInputDiv = $j( '<div class="mwe-upwiz-details-fieldname-input ui-helper-clearfix"></div>' )
		.append(
			dateErrorDiv,
			$j( '<div class="mwe-upwiz-details-fieldname"></div>' ).append( gM( 'mwe-upwiz-date-created' ) ).requiredFieldLabel().addHint( 'date' ),
			$j( '<div class="mwe-upwiz-details-input"></div>' ).append( _this.dateInput ) );

	var moreDetailsCtrlDiv = $j( '<div class="mwe-upwiz-details-more-options"></div>' );

	var moreDetailsDiv = $j('<div class="mwe-more-details"></div>');

	var otherInformationId = "otherInformation" + _this.upload.index;
	_this.otherInformationInput = $j( '<textarea id="' + otherInformationId + '" name="' + otherInformationId + '" class="mwe-upwiz-other-textarea"></textarea>' )
		.growTextArea();

	var otherInformationDiv = $j('<div></div>')
		.append( $j( '<div class="mwe-upwiz-details-more-label"></div>' ).append( gM( 'mwe-upwiz-other' ) ).addHint( 'other' ) )
		.append( _this.otherInformationInput );

	var latId = "location-latitude" + _this.upload.index;
	var lonId = "location-longitude" + _this.upload.index;
	var altId = "location-altitude" + _this.upload.index;

	_this.latInput = $j( '<input type="text" id="' + latId + '" name="' + latId + '" class="mwe-loc-lat" size="10"/>' );
	_this.lonInput = $j( '<input type="text" id="' + lonId + '" name="' + lonId + '" class="mwe-loc-lon" size="10"/>' );
	_this.altInput = $j( '<input type="text" id="' + altId + '" name="' + altId + '" class="mwe-loc-alt" size="10"/>' );

	_this.latInput.val( mw.UploadWizard.config.defaultLat );
	_this.lonInput.val( mw.UploadWizard.config.defaultLon );
	_this.altInput.val( mw.UploadWizard.config.defaultAlt );

	var latDiv = $j( '<div class="mwe-location-lat"></div>' )
		.append( $j ( '<div class="mwe-location-lat-label"></div>' ).append( gM( 'mwe-upwiz-location-lat' )  ) )
		.append( _this.latInput );
	var lonDiv = $j( '<div class="mwe-location-lon"></div>' )
		.append( $j ( '<div class="mwe-location-lon-label"></div>' ).append( gM( 'mwe-upwiz-location-lon' )  ) )
		.append( _this.lonInput );
	var altDiv = $j( '<div class="mwe-location-alt"></div>' )
		.append( $j ( '<div class="mwe-location-alt-label"></div>' ).append( gM( 'mwe-upwiz-location-alt' )  ) )
		.append( _this.altInput );

	var locationDiv = $j( '<div class="mwe-location mwe-upwiz-details-fieldname-input ui-helper-clearfix"></div>' )
		.append( $j ('<div class="mwe-location-label"></div>' )
		.append( gM( 'mwe-upwiz-location' ) )
		.addHint( 'location' ) )
		.append(
			$j( '<div class="mwe-upwiz-details-input-error"><label class="mwe-validator-error" for="' + latId + '" generated="true"/></div>' ),
			$j( '<div class="mwe-upwiz-details-input-error"><label class="mwe-validator-error" for="' + lonId + '" generated="true"/></div>' ),
			$j( '<div class="mwe-upwiz-details-input-error"><label class="mwe-validator-error" for="' + altId + '" generated="true"/></div>' ),
			latDiv, lonDiv, altDiv
		)

	$j( moreDetailsDiv ).append(
		$categoriesDiv,
		locationDiv,
		otherInformationDiv
	);
	console.log(moreDetailsDiv);
	/* Build the form for the file upload */
	_this.$form = $j( '<form id="mwe-upwiz-detailsform' + _this.upload.index + '"></form>' ).addClass( 'detailsForm' );
	_this.$form.append(
		titleContainerDiv,
		_this.descriptionsDiv,
		descriptionAdderDiv,
		_this.copyrightInfoFieldset,
		dateInputDiv
	);


	_this.mapInitiator= function(){
		console.log('map initiator called');
		var mapDiv = $j('<div id="map" style="height:400px"></div>');
		$j( _this.$form ).append(mapDiv);
		_this.upload.wizard.map = new L.Map('map');
		_this.map=_this.upload.wizard.map;
		var cloudmade = new L.TileLayer('http://{s}.tile.cloudmade.com/1036eaf35f0f448d8bde1b9927462962/997/256/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery � <a href="http://cloudmade.com">CloudMade</a>',
				maxZoom: 18
			});
		var london = new L.LatLng(51.505, -0.09); // geographical point (longitude and latitude)
		_this.map.setView(london, 13).addLayer(cloudmade);
	}

	if ( mw.UploadWizard.config.idField ) {
		var idFieldId = "idField" + ( _this.upload.index ).toString();
		_this.idFieldInput = $j( '<input />' ).attr( {
			'type': 'text',
			'id': idFieldId,
			'name': idFieldId,
			'class': 'mwe-idfield',
			'maxlength': mw.UploadWizard.config.idFieldMaxLength
		} );

		_this.idFieldInput.val( mw.UploadWizard.config.idFieldInitialValue );

		_this.$form.append(
			$j( '<div class="mwe-upwiz-details-input-error"><label class="mwe-validator-error" for="' + idFieldId + '" generated="true"/></div>' ),
			$j( '<div class="mwe-upwiz-details-fieldname"></div>' ).text( mw.UploadWizard.config.idFieldLabel ).requiredFieldLabel(),
			$j( '<div class="mwe-id-field"></div>' ).append( _this.idFieldInput )
		);
	}

	_this.$form.append(
		moreDetailsCtrlDiv,
		moreDetailsDiv
	);


	_this.copyMetadataCtrlDiv = undefined;

	// If this is the first upload in a batch, we offer the user the option
	// to apply the metadata they enter to all other uploads in the same batch.
	if( mw.UploadWizard.config.copyMetadataFeature === true && _this.upload.index === 0 ) {

		_this.copyMetadataCtrlDiv = $j( '<div class="mwe-upwiz-details-copy-metadata"></div>' );
		var copyMetadataDiv = $j( '<div class="mwe-upwiz-metadata-copier"></div>' );

		$j.each( _this.copyMetadataTypes, function addToMetadataDiv( i, v ) {
			var cb = 'mwe-upwiz-copy-' + v;
			var copyMetadataMsg = gM( cb );
			copyMetadataDiv.append( $j( '<input type="checkbox" name="' + cb + '" id="' + cb + '" checked />' ) );
			copyMetadataDiv.append( $j( '<label for="' + cb + '">' + copyMetadataMsg + '</label>' ) );
			copyMetadataDiv.append( $j( '<br />' ) );
		} ) ;

		copyMetadataDiv.append(
			$j( '<button type="button" id="mwe-upwiz-copy-metadata-button">'  )
			.msg( 'mwe-upwiz-copy-metadata-button' )
			.button()
			.click(
				function( e ) {
					$j.each( _this.copyMetadataTypes, function makeCopies( i, metadataType ) {
							if ( $j( '#mwe-upwiz-copy-' + metadataType ).is( ':checked' ) ) {
								_this.copyMetadata( metadataType );
							}
						} );
					e.stopPropagation();
				}
			)
		);

		mw.UploadWizardUtil.makeToggler(
			_this.copyMetadataCtrlDiv,
			copyMetadataDiv,
			'mwe-upwiz-copy-metadata'
		);

		// Default state is collapsed, will be shown if there's more than one upload.
		// See showNext in mw.UploadWizard
		_this.copyMetadataCtrlDiv.hide();
		_this.$form.append( _this.copyMetadataCtrlDiv, copyMetadataDiv );

	}

	_this.submittingDiv = $j( '<div></div>' ).addClass( 'mwe-upwiz-submitting' )
		.append(
			$j( '<div></div>' ).addClass( 'mwe-upwiz-file-indicator' ),
			$j( '<div></div>' ).addClass( 'mwe-upwiz-details-texts' ).append(
				$j( '<div></div>' ).addClass( 'mwe-upwiz-visible-file-filename-text' ),
				$j( '<div></div>' ).addClass( 'mwe-upwiz-file-status-line' )
			)
		);

	// Add in remove control to submittingDiv
	_this.$removeCtrl = $j.fn.removeCtrl(
			'mwe-upwiz-remove',
			'mwe-upwiz-remove-upload',
			function() { _this.upload.remove(); }
		).addClass( "mwe-upwiz-file-status-line-item" );

	_this.submittingDiv.find( '.mwe-upwiz-file-status-line' )
		.append( _this.$removeCtrl );

	$j( _this.dataDiv ).append(
		_this.$form,
		_this.submittingDiv
	).morphCrossfader();

	$j( _this.div ).append(
		_this.thumbnailContainerDiv,
		_this.dataDiv
	);

	_this.$form.validate();
	_this.$form.find( '.mwe-date' ).rules( "add", {
		required: true,
		/* dateISO: true, */
		messages: {
			required: gM( 'mwe-upwiz-error-blank' )
			/* dateISO: gM( 'mwe-upwiz-error-date' ) */
		}
	} );

	_this.$form.find( '.mwe-date' )
		.datepicker( {
			dateFormat: 'yy-mm-dd',
			constrainInput: false,
			//buttonImage: mw.getMwEmbedPath() + 'skins/common/images/calendar.gif',
			showOn: 'focus',
			/* buttonImage: '???',
			buttonImageOnly: true,  */
			changeMonth: true,
			changeYear: true,
			showAnim: 'slideDown',
			showButtonPanel: true
		} )
		.data( 'open', 0 )
		.click( function() {
			var $this = $j( this );
			if ( $this.data( 'open' ) === 0 ) {
				$this.data( 'open', 1 ).datepicker( 'show' );
			} else {
				$this.data( 'open', 0 ).datepicker( 'hide' );
			}
		} );

	if ( mw.UploadWizard.config.idField ) {
		_this.idFieldInput.rules( "add", {
			required: true,
			messages: {
				required: gM( 'mwe-upwiz-error-blank' )
			}
		} );
	}

	_this.latInput.rules( "add", {
		min: -90,
		max: 90,
		messages: {
			min: gM( 'mwe-upwiz-error-latitude' ),
			max: gM( 'mwe-upwiz-error-latitude' )
		}
	} );

	_this.lonInput.rules( "add", {
		min: -180,
		max: 180,
		messages: {
			min: gM( 'mwe-upwiz-error-longitude' ),
			max: gM( 'mwe-upwiz-error-longitude' )
		}
	} );

	_this.altInput.rules( "add", {
		number: true,
		messages: {
			number: gM( 'mwe-upwiz-error-altitude' )
		}
	} );

	mw.UploadWizardUtil.makeToggler(
		moreDetailsCtrlDiv,
		moreDetailsDiv,
		'mwe-upwiz-more-options'
	);

	_this.addDescription(
		!mw.UploadWizard.config.idField,
		mw.config.get( 'wgUserLanguage' ),
		false,
		mw.UploadWizard.config.defaultDescription
	);

	if ( mw.config.get( 'UploadWizardConfig' ).useTitleBlacklistApi ) {
		// less strict checking, since TitleBlacklist checks should catch most errors.
		_this.$form.find( '.mwe-title' )
			.rules( "add", {
				required: true,
				messages: {
					required: gM( 'mwe-upwiz-error-blank' )
				}
			} );
	} else {
		// make the title field required, and non-blacklisted
		_this.$form.find( '.mwe-title' )
			.rules( "add", {
				required: true,
				titleBadchars: true,
				titleSenselessimagename: true,
				titleThumbnail: true,
				titleExtension: true,
				messages: {
					required: gM( 'mwe-upwiz-error-blank' ),
					titleBadchars: gM( 'mwe-upwiz-error-title-badchars' ),
					titleSenselessimagename: gM( 'mwe-upwiz-error-title-senselessimagename' ),
					titleThumbnail: gM( 'mwe-upwiz-error-title-thumbnail' ),
					titleExtension: gM( 'mwe-upwiz-error-title-extension' )
				}
			} );
	}
	// make this a category picker
	var hiddenCats = mw.UploadWizard.config.autoCategories === undefined ? [] : mw.UploadWizard.config.autoCategories;
	if ( mw.UploadWizard.config.autoCategory !== undefined && mw.UploadWizard.config.autoCategory !== '' ) {
		hiddenCats.push( mw.UploadWizard.config.autoCategory );
	}

	var missingCatsWikiText = null;
	if ( mw.UploadWizard.config.missingCategoriesWikiText !== undefined
			&& mw.UploadWizard.config.missingCategoriesWikiText !== '' ) {
		missingCatsWikiText = mw.UploadWizard.config.missingCategoriesWikiText;
	}

	$categoriesDiv.find( '.mwe-upwiz-details-input' )
			.find( 'input' )
			.mwCoolCats( {
				api: _this.upload.api,
				hiddenCats: hiddenCats,
				buttontext: gM( 'mwe-upwiz-categories-add' ),
				cats: mw.UploadWizard.config.defaultCategories === undefined ? [] : mw.UploadWizard.config.defaultCategories,
				missingCatsWikiText: missingCatsWikiText,
				willbeaddedtext: gM( 'mwe-upwiz-category-will-be-added' )
			} );

};


mw.UploadWizardDetails.prototype = {

	// Has this details object been attached to the DOM already?
	isAttached: false,

	/*
	 * Append the div for this details object to the DOM.
	 * We need to ensure that we add divs in the right order
	 * (the order in which the user selected files).
	 *
	 * Will only append once.
	 */
	attach: function() {
		if ( !this.isAttached ) {
			$j( this.containerDiv ).append( this.div );
			_this=this;
			if(!_this.upload.wizard.map){
				_this.mapInitiator();
			}
			else{
				_this.map=_this.upload.wizard.map;
			}
			_this.prefillMap();
			this.isAttached = true;
		}
	},

	// Metadata which we can copy over to other details objects
	copyMetadataTypes: [ 'title', 'description', 'date', 'categories', 'location', 'other' ],

	/*
	 * Copy metadata from the first upload to other uploads.
	 *
	 * We don't worry too much about validation here since all input is validated prior to
	 * submission, and the user will be alerted about validation errors in the first upload
	 * description.
	 *
	 * @param String metadataType One of the types defined in the copyMetadataTypes property
	 */
	copyMetadata: function ( metadataType ) {

		var _this = this;

		// In the simplest case, we can use this self-explanatory vanilla loop.
		var simpleCopy = function( id, tag ) {
			if ( tag === undefined ) tag = 'input';
			var firstId = '#' + id + '0';
			var firstValue = $j( firstId ).val();
			$j( tag + '[id^=' + id + ']:not(' + firstId + ')' ).each( function () {
				$j( this ).val( firstValue );
			});
		};

		if ( metadataType === 'title' ) {

			// Add number suffix to first title if no numbering present
			var titleZero = $j( '#title0' ).val();
			var matches = titleZero.match( /(\D+)(\d{1,3})(\D*)$/ );
			if ( matches === null ) {
				titleZero = titleZero + ' 01';
				// After setting the value, we must trigger input processing for the change to take effect
				$j( '#title0' ).val( titleZero ).keyup();
			}

			// Overwrite remaining title inputs with first title + increment of rightmost
			// number in the title. Note: We ignore numbers with more than three digits, because these
			// are more likely to be years ("Wikimania 2011 Celebration") or other non-sequence
			// numbers.
			$j( 'input[id^=title]:not(#title0)' ).each( function (i) {
					var currentTitle = $j( this ).val();
					currentTitle = titleZero.replace( /(\D+)(\d{1,3})(\D*)$/,
						function( str, m1, m2, m3 ) {
						var newstr = ( +m2 + i + 1 ) + '';
						return m1 + new Array( m2.length + 1 - newstr.length )
						.join( '0' ) + newstr + m3;
					}
				);
				$j( this ).val( currentTitle ).keyup();

			} );

		} else if ( metadataType === 'description' ) {

			var destUploads = _this.upload.wizard.uploads;
			$j.each( destUploads, function ( uploadIndex, upload ) {

				if ( uploadIndex > 0 ) {

					// We could merge, but it's unlikely that the user wants to do anything other
					// than just having the same descriptions across all files, so rather than
					// create unintended consequences, we nuke any existing descriptions first.
					upload.details.removeAllDescriptions();

					$j.each( _this.descriptions, function ( srcDescriptionIndex, srcDescription ) {
						var isRequired = srcDescription.isRequired;
						var languageCode = srcDescription.getLanguage();
						var allowRemoval = !isRequired;
						var descriptionText = srcDescription.getText();
						upload.details.addDescription ( isRequired, languageCode, allowRemoval, descriptionText );
					} );
				}
			} );

		} else if ( metadataType === 'date' ) {

			simpleCopy( 'dateInput' );

		} else if ( metadataType === 'categories' ) {

			var visibleCategoriesZero = $j( '#categories0' ).get( 0 ).getCats( ':not(.hidden)' );
			var hiddenCategoriesZero = $j( '#categories0' ).get( 0 ).getCats( '.hidden' );
			$j( 'input[id^=categories]:not(#categories0)' ).each( function( i, input ) {
				if ( this.id !== 'categories0' ) {

					// As with descriptions, we nuke whatever categories are there already.
					input.removeAllCats();

					$j.each(visibleCategoriesZero, function() {
						input.insertCat( this, false );
					});
					$j.each(hiddenCategoriesZero, function() {
						input.insertCat( this, true );
					});

				}
			});

		} else if ( metadataType === 'location' ) {

			simpleCopy( 'location-latitude' );
			simpleCopy( 'location-longitude' );
			simpleCopy( 'location-altitude' );

		} else if ( metadataType === 'other' ) {

			simpleCopy( 'otherInformation', 'textarea' );

		} else {
			throw new Error( 'Attempted to copy unsupported metadata type: ' + metadataType );
		}
	},

	/**
	 * check entire form for validity
	 */
	// return boolean if we are ready to go.
	// side effect: add error text to the page for fields in an incorrect state.
	// we must call EVERY valid() function due to side effects; do not short-circuit.
	valid: function() {
		var _this = this;
		// at least one description -- never mind, we are disallowing removal of first description
		// all the descriptions -- check min & max length
		// categories are assumed valid
		// pop open the 'more-options' if the date is bad
		// location?

		// make sure title is valid
		var titleInputValid = $j( _this.titleInput ).data( 'valid' );
		if ( titleInputValid === undefined ) {
			alert( "please wait, still checking the title for uniqueness..." );
			return false;
		}

		// make sure licenses are valid (needed for multi-file deed selection)
		var deedValid = _this.upload.deedChooser.valid();

		// all other fields validated with validator js
		var formValid = _this.$form.valid();

		return titleInputValid && deedValid && formValid;
	},


	/**
	 * toggles whether we use the 'macro' deed or our own
	 */
	useCustomDeedChooser: function() {
		var _this = this;
		_this.copyrightInfoFieldset.show();
		_this.upload.wizardDeedChooser = _this.upload.deedChooser;

		_this.upload.deedChooser = new mw.UploadWizardDeedChooser(
			_this.deedDiv,
			_this.upload.wizard.getLicensingDeeds(),
			[ _this.upload ]
		);

		_this.upload.deedChooser.onLayoutReady();
	},

	/**
	 * show file destination field as "busy" while checking
	 * @param busy boolean true = show busy-ness, false = remove
	 */
	toggleDestinationBusy: function ( busy ) {
		var _this = this;
		if (busy) {
			_this.titleInput.addClass( "busy" );
			$j( _this.titleInput ).data( 'valid', undefined );
		} else {
			_this.titleInput.removeClass( "busy" );
		}
	},

	/**
	 * Process the result of a destination filename check.
	 * See mw.DestinationChecker.js for documentation of result format
	 * XXX would be simpler if we created all these divs in the DOM and had a more jquery-friendly way of selecting
 	 * attrs. Instead we create & destroy whole interface each time. Won't someone think of the DOM elements?
	 * @param result
	 */
	processDestinationCheck: function( result ) {
		var _this = this;
		var $errorEl = _this.$form.find( 'label[for=' + _this.titleId + '].errorTitleUnique' );

		if ( result.unique.isUnique && result.blacklist.notBlacklisted ) {
			$j( _this.titleInput ).data( 'valid', true );
			$errorEl.hide().empty();
			_this.ignoreWarningsInput = undefined;
			return;
		}

		// something is wrong with this title.
		$j( _this.titleInput ).data( 'valid', false );

		var titleString;
		var errHtml;

		try {
			titleString = new mw.Title( result.title, fileNsId ).toString();
		} catch ( e ) {
			// unparseable result from unique test?
			titleString = '[unparseable name]';
		}

		if ( ! result.unique.isUnique ) {
			// result is NOT unique
			if ( result.href ) {
				errHtml = gM( 'mwe-upwiz-fileexists-replace-on-page', titleString, $j( '<a />' ).attr( { href: result.href, target: '_blank' } ) );
			} else {
				errHtml = gM( 'mwe-upwiz-fileexists-replace-no-link', titleString );
			}

			$errorEl.html( errHtml ).show();
		} else {
			errHtml = gM( 'mwe-upwiz-blacklisted', titleString );

			$errorEl.html( errHtml );

			var completeErrorLink = $j( '<span class="contentSubLink"></span>' ).msg(
				'mwe-upwiz-feedback-blacklist-info-prompt',
				function() {
					var errorDialog = new mw.ErrorDialog( result.blacklist.blacklistReason );
					errorDialog.launch();
					return false;
				}
			);

			$errorEl.append( '&nbsp;&middot;&nbsp;' ).append( completeErrorLink );

			// feedback request for titleblacklist
			if ( mw.UploadWizard.config['blacklistIssuesPage'] !== undefined && mw.UploadWizard.config['blacklistIssuesPage'] !== '' ) {
				var feedback = new mw.Feedback(
					_this.api,
					new mw.Title( mw.UploadWizard.config['blacklistIssuesPage'] ),
					'mwe-upwiz-feedback-title'
				);

				var feedbackLink = $j( '<span class="contentSubLink"></span>' ).msg(
					'mwe-upwiz-feedback-blacklist-report-prompt',
					function() {
						feedback.launch( {
							message: gM( 'mwe-upwiz-feedback-blacklist-line-intro', result.blacklist.blacklistLine ),
							subject: gM( 'mwe-upwiz-feedback-blacklist-subject', titleString )
						} );
						return false;
					}
				);

				$errorEl.append( '&nbsp;&middot;&nbsp;' ).append( feedbackLink );
			}

			$errorEl.show();
		}
	},

	/**
	 * Do anything related to a change in the number of descriptions
	 */
	recountDescriptions: function() {
		var _this = this;
		// if there is some maximum number of descriptions, deal with that here
		$j( _this.descriptionAdder ).html( gM( 'mwe-upwiz-desc-add-' + ( _this.descriptions.length === 0 ? '0' : 'n' )  )  );
	},


	/**
	 * Add a new description
	 */
	addDescription: function( required, languageCode, allowRemove, initialValue ) {
		var _this = this;
		if ( required === undefined ) {
			required = false;
		}

		if ( languageCode === undefined ) {
			languageCode = mw.LanguageUpWiz.UNKNOWN;
		}

		if ( allowRemove === undefined ) {
			allowRemove = true;
		}

		var description = new mw.UploadWizardDescription( languageCode, required, initialValue );

		if ( !required && allowRemove ) {
			$j( description.div  ).append(
				 $j.fn.removeCtrl( null, 'mwe-upwiz-remove-description', function() { _this.removeDescription( description ); } )
			);
		}

		$j( _this.descriptionsDiv ).append( description.div  );

		// must defer adding rules until it's in a form
		// sigh, this would be simpler if we refactored to be more jquery style, passing DOM element downward
		description.addValidationRules( required );

		_this.descriptions.push( description  );
		_this.recountDescriptions();
	},

	/**
	 * Remove a description
	 * @param description
	 */
	removeDescription: function( description  ) {
		var _this = this;
		$j( description.div ).remove();
		mw.UploadWizardUtil.removeItem( _this.descriptions, description  );
		_this.recountDescriptions();
	},

	removeAllDescriptions: function() {
		var _this = this;
		$j( _this.descriptionsDiv ).children().remove();
		_this.descriptions = [];
		_this.recountDescriptions();
	},

	/**
	 * Display an error with details
	 * XXX this is a lot like upload ui's error -- should merge
	 */
	error: function() {
		var _this = this;
		var args = Array.prototype.slice.call( arguments  ); // copies arguments into a real array
		var msg = 'mwe-upwiz-upload-error-' + args[0];
		$j( _this.errorDiv ).append( $j( '<p class="mwe-upwiz-upload-error">' + gM( msg, args.slice( 1 ) ) + '</p>' ) );
		// apply a error style to entire did
		$j( _this.div ).addClass( 'mwe-upwiz-upload-error' );
		$j( _this.dataDiv ).hide();
		$j( _this.errorDiv ).show();
	},

	/**
	 * Given the API result pull some info into the form ( for instance, extracted from EXIF, desired filename )
	 * @param result	Upload API result object
	 */
	populate: function() {
		var _this = this;
		_this.upload.setThumbnail(
			_this.thumbnailDiv,
			mw.UploadWizard.config['thumbnailWidth'],
			mw.UploadWizard.config['thumbnailMaxHeight'],
			true
		 );
		_this.prefillDate();
		_this.prefillSource();
		_this.prefillAuthor();
		_this.prefillTitle();
		_this.prefillLocation();
	},

	/**
	 * Check if we got an EXIF date back; otherwise use today's date; and enter it into the details
	 * XXX We ought to be using date + time here...
	 * EXIF examples tend to be in ISO 8601, but the separators are sometimes things like colons, and they have lots of trailing info
	 * (which we should actually be using, such as time and timezone)
	 */
	prefillDate: function() {
		// XXX surely we have this function somewhere already
		function pad( n ) {
			return n < 10 ? "0" + n : n;
		}

		var _this = this;
		var yyyyMmDdRegex = /^(\d\d\d\d)[:\/-](\d\d)[:\/-](\d\d)\D.*/;
		var dateObj;
		if ( _this.upload.imageinfo.metadata ) {
			var metadata = _this.upload.imageinfo.metadata;
			$j.each( [ 'datetimeoriginal', 'datetimedigitized', 'datetime', 'date' ], function( i, propName ) {
				var dateInfo = metadata[propName];
				if ( ! mw.isEmpty( dateInfo ) ) {
					var matches = $j.trim( dateInfo ).match( yyyyMmDdRegex );
					if ( ! mw.isEmpty( matches ) ) {
						dateObj = new Date( parseInt( matches[1], 10 ),
								    parseInt( matches[2], 10 ) - 1,
								    parseInt( matches[3], 10 ) );
						return false; // break from $j.each
					}
				}
			} );
		}

		// if we don't have EXIF or other metadata, let's use "now"
		// XXX if we have FileAPI, it might be clever to look at file attrs, saved
		// in the upload object for use here later, perhaps
		if ( dateObj === undefined ) {
			dateObj = new Date();
		}
		dateStr = dateObj.getFullYear() + '-' + pad( dateObj.getMonth() + 1 ) + '-' + pad( dateObj.getDate() );

		// ok by now we should definitely have a dateObj and a date string
		$j( _this.dateInput ).val( dateStr );
	},

	/**
	 * Set the title of the thing we just uploaded, visibly
	 * Note: the interface's notion of "filename" versus "title" is the opposite of MediaWiki
	 */
	prefillTitle: function() {
		$j( this.titleInput ).val( this.upload.title.getNameText() );
	},

	/**
 	 * Prefill location inputs (and/or scroll to position on map) from image info and metadata
	 *
	 * As of MediaWiki 1.18, the exif parser translates the rational GPS data tagged by the camera
	 * to decimal format.  Let's just use that.
	 * Leaving out altitude ref for now (for no good reason).
	 */
	prefillLocation: function() {
		var _this = this;
		console.log('prefillLocation called');
		if ( _this.upload.imageinfo.metadata ) {
			var m = _this.upload.imageinfo.metadata;
			//var map_container=$j('<div id="map' +_this.upload.index +'"></div>');
			//var map_container=$j('#map' + _this.upload.index);
			if ( m['gpslatitude'] !== undefined && m['gpslongitude'] !== undefined   ) {
				$j( _this.latInput ).val( m['gpslatitude'] );
				$j( _this.lonInput ).val( m['gpslongitude'] );
			}
			if ( m['gpsaltitude'] !== undefined ) {
				$j( _this.altInput ).val( m['gpsaltitude'] );
			}
		}
	},

	prefillMap : function(){

		_this = this;
		var m= _this.upload.imageinfo.metadata;
		if ( m['gpslatitude'] !== undefined && m['gpslongitude'] !== undefined   ) {

			var markerLocation = new L.LatLng(m['gpslatitude'], m['gpslongitude']);
			var marker = new L.Marker(markerLocation);
			_this.map.addLayer(marker);

		}

		else{
				_this.map.on('click', onMapClick);
				function onMapClick(e){
					if(_this.marker){
						_this.map.removeLayer(_this.marker);
					}
					var latlngStr = '(' + e.latlng.lat.toFixed(3) + ', ' + e.latlng.lng.toFixed(3) + ')';
					console.log(latlngStr);
					$j( _this.latInput ).val( e.latlng.lat.toFixed(3));
					$j( _this.lonInput ).val( e.latlng.lng.toFixed(3));
					var markerLocation = new L.LatLng(e.latlng.lat.toFixed(3), e.latlng.lng.toFixed(3));
					_this.marker = new L.Marker(markerLocation);
					_this.map.addLayer(_this.marker);
				};

			}



	},

	/**
	 * Given a decimal latitude and longitude, return filled out {{Location}} template
	 *
	 * The {{Location dec}} template is preferred and makes this conversion unnecessary.  This function is not used.
	 *
	 * @param latitude decimal latitude ( -90.0 >= n >= 90.0 ; south = negative )
	 * @param longitude decimal longitude ( -180.0 >= n >= 180.0 ; west = negative )
	 * @param scale (optional) how rough the geocoding is.
	 * @param heading (optional) what direction the camera is pointing in. (decimal 0.0-360.0, 0 = north, 90 = E)
	 * @return string with WikiText which will geotag this record
	 */
	coordsToWikiText: function(latitude, longitude, scale, heading) {
		//Wikipedia
		//http://en.wikipedia.org/wiki/Wikipedia:WikiProject_Geographical_coordinates#Parameters
		// http://en.wikipedia.org/wiki/Template:Coord
		//{{coord|61.1631|-149.9721|type:landmark_globe:earth_region:US-AK_scale:150000_source:gnis|name=Kulis Air National Guard Base}}

		//Wikimedia Commons
		//{{Coor dms|41|19|20.4|N|19|38|36.7|E}}
		//{{Location}}

	},

	/**
	 * If there is a way to figure out source from image info, do so here
	 * XXX user pref?
	 */
	prefillSource: function() {
		// we have no way to do this AFAICT
	},

	/**
	 * Prefill author (such as can be determined) from image info and metadata
	 * XXX user pref?
	 */
	prefillAuthor: function() {
		var _this = this;
		if ( _this.upload.imageinfo.metadata && _this.upload.imageinfo.metadata.author ) {
			$j( _this.authorInput ).val( _this.upload.imageinfo.metadata.author );
		}

	},

	/**
	 * Prefill license (such as can be determined) from image info and metadata
	 * XXX user pref?
	 */
	prefillLicense: function() {
		var _this = this;
		if ( _this.upload.imageinfo.metadata ) {
			var copyright = _this.upload.imageinfo.metadata.copyright;
			if (copyright !== undefined) {
				if (copyright.match(/\bcc-by-sa\b/i)) {
					alert("unimplemented cc-by-sa in prefillLicense");
					// XXX set license to be that CC-BY-SA
				} else if (copyright.match(/\bcc-by\b/i)) {
					alert("unimplemented cc-by in prefillLicense");
					// XXX set license to be that
				} else if (copyright.match(/\bcc-zero\b/i)) {
					alert("unimplemented cc-zero in prefillLicense");
					// XXX set license to be that
					// XXX any other licenses we could guess from copyright statement
				} else {
					$j( _this.licenseInput ).val( copyright );
				}
			}
		}
		// if we still haven't set a copyright use the user's preferences?
	},


	/**
	 * Convert entire details for this file into wikiText, which will then be posted to the file
	 * @return wikitext representing all details
	 */
	getWikiText: function() {
		var _this = this;

		// if invalid, should produce side effects in the form
		// instructing user to fix.
		if ( ! _this.valid() ) {
			return null;
		}

		wikiText = '';


		// http://commons.wikimedia.org / wiki / Template:Information

		// can we be more slick and do this with maps, applys, joins?
		var information = {
			'description' : '',	 // {{lang|description in lang}}*   required
			'date' : '',		 // YYYY, YYYY-MM, or YYYY-MM-DD     required  - use jquery but allow editing, then double check for sane date.
			'source' : '',    	 // {{own}} or wikitext    optional
			'author' : '',		 // any wikitext, but particularly {{Creator:Name Surname}}   required
			'permission' : '',       // leave blank unless OTRS pending; by default will be "see below"   optional
			'other_versions' : '',   // pipe separated list, other versions     optional
			'other_fields' : ''      // ???     additional table fields
		};

		// sanity check the descriptions -- do not have two in the same lang
		// all should be a known lang
		if ( _this.descriptions.length === 0 ) {
			alert("something has gone horribly wrong, unimplemented error check for zero descriptions");
			// XXX ruh roh
			// we should not even allow them to press the button ( ? ) but then what about the queue...
		}
		$j.each( _this.descriptions, function( i, desc ) {
			if ( i !== 0 ) {
				information['description'] += '\n';
			}
			information['description'] += desc.getWikiText();
		} );

		// Add id field if needed
		if ( mw.UploadWizard.config.idField ) {
			var idFieldValue = $j.trim( $j( _this.idFieldInput ).val() );

			if ( ! mw.isEmpty( idFieldValue ) ) { // HAXXX
				information['description'] += mw.UploadWizard.config.idField.replace( '$1', idFieldValue );
			}
		}

		information['date'] = $j.trim( $j( _this.dateInput ).val() );

		var deed = _this.upload.deedChooser.deed;

		information['source'] = deed.getSourceWikiText();

		information['author'] = deed.getAuthorWikiText();

		var info = '';
		for ( var key in information ) {
			info += '|' + key + '=' + information[key] + "\n";
		}

		wikiText += "=={{int:filedesc}}==\n";

		var lat = $j.trim( $j( _this.latInput ).val() );
		var lon = $j.trim( $j( _this.lonInput ).val() );
		var alt = $j.trim( $j( _this.altInput ).val() );

		// Do not require the altitude to be set, to prevent people from entering 0
		// while it's actually unknown.
		// When none is provided, this will result in {{Location dec|int|int|}}.
		if( lat !== '' && lon !== '' ) {
			wikiText += '{{Location dec|'+ lat + '|' + lon + '|' + alt + '}}\n';
		}

		wikiText += '{{Information\n' + info + '}}\n\n';

		// add an "anything else" template if needed
		var otherInfoWikiText = $j.trim( $j( _this.otherInformationInput ).val() );
		if ( ! mw.isEmpty( otherInfoWikiText ) ) {
			wikiText += otherInfoWikiText + "\n\n";
		}

		// add licensing information
		wikiText += "=={{int:license-header}}==\n";
		wikiText += deed.getLicenseWikiText() + "\n\n";

		if ( mw.UploadWizard.config.autoWikiText !== undefined ) {
			wikiText += mw.UploadWizard.config.autoWikiText;
		}

		// add categories
		wikiText += _this.div.find( '.categoryInput' ).get(0).getWikiText() + "\n\n";

		// sanitize wikitext if TextCleaner is defined (MediaWiki:TextCleaner.js)
		if ( typeof TextCleaner !== 'undefined' && typeof TextCleaner.sanitizeWikiText === 'function' ) {
			wikiText = TextCleaner.sanitizeWikiText( wikiText, true );
		}

		return wikiText;
	},

	/**
	 * Post wikitext as edited here, to the file
	 * XXX This should be split up -- one part should get wikitext from the interface here, and the ajax call
	 * should be be part of upload
	 */
	submit: function() {
		var _this = this;

		$('form', _this.containerDiv).submit();

		_this.upload.state = 'submitting-details';
		_this.setStatus( gM( 'mwe-upwiz-submitting-details' ) );
		_this.showIndicator( 'progress' );

		// XXX check state of details for okayness ( license selected, at least one desc, sane filename )
		// validation does MOST of this already
		var wikiText = _this.getWikiText();

		var params = {
			action: 'upload',
			filekey: _this.upload.fileKey,
			filename: _this.upload.title.getMain(),
			text: wikiText,
			summary: "User created page with " + mw.UploadWizard.userAgent
		};

		var err = function( code, info ) {
			_this.upload.state = 'error';
			_this.processError( code, info );
		};


		var ok = function( result ) {
			if ( result && result.upload && result.upload.imageinfo ) {
				_this.upload.extractImageInfo( result.upload.imageinfo );
				_this.upload.detailsProgress = 1.0;
				_this.upload.state = 'complete';
				_this.showIndicator( 'uploaded' );
				_this.setStatus( gM( 'mwe-upwiz-published' ) );
			} else if ( result && result.upload.warnings ) {
				var warnings = result.upload.warnings;
				if ( warnings['was-deleted'] ) {
					_this.recoverFromError( _this.titleId, gM( 'mwe-upwiz-api-warning-was-deleted', _this.upload.title.toString() ) );
				} else if ( warnings['thumb'] ) {
					_this.recoverFromError( _this.titleId, gM( 'mwe-upwiz-error-title-thumbnail' ) );
				} else if ( warnings['bad-prefix'] ) {
					_this.recoverFromError( _this.titleId, gM( 'mwe-upwiz-error-title-senselessimagename' ) );
				} else if ( warnings['exists'] ) {
					_this.recoverFromError( _this.titleId, gM( 'mwe-upwiz-api-warning-exists', _this.upload.title.getUrl() ) );
				} else if ( warnings['duplicate'] ) {
					_this.showError( 'duplicate', gM( 'mwe-upwiz-upload-error-duplicate' ) );
				} else {
					var warningsKeys = [];
					$j.each( warnings, function( key, val ) {
						warningsKeys.push( key );
					} );
					_this.upload.state = 'error';
					_this.showError( 'unknown', gM( 'api-error-unknown-warning', warningsKeys.join( ', ' ) ) );
				}
			} else {
				err( 'details-info-missing', result );
			}
		};

		_this.upload.api.postWithEditToken( params, ok, err );
	},


	/**
	 * Create a recoverable error -- show the form again, and highlight the problematic field. Go to error state but do not block submission
	 * @param {String} id of input field -- presumed to be within this upload's details form.
	 * @param {String} error message to show
	 */
	recoverFromError: function( fieldId, errorMessage ) {
		this.upload.state = 'error';
		this.dataDiv.morphCrossfade( '.detailsForm' );
		$j( '#' + fieldId ).addClass( 'mwe-error' );
		this.$form.find( 'label[for=' + fieldId + '].errorRecovery' ).html( errorMessage ).show();
	},

	/**
	 * Show error state, possibly using a recoverable error form
	 * @param {String} error code
	 * @param {String} status line
	 */
	showError: function( code, statusLine ) {
		this.showIndicator( 'error' );
		this.setStatus( statusLine );
	},


	/**
	 * Decide how to treat various errors
	 * @param {String} error code
	 * @param {Mixed} result from ajax call
	 */
	processError: function( code, result ) {
		var statusLine = gM( 'api-error-unclassified' );
		var titleErrorMap = {
			'senselessimagename': 'senselessimagename',
			'fileexists-shared-forbidden': 'fileexists-shared-forbidden',
		 	'titleblacklist-custom-filename': 'hosting',
			'titleblacklist-custom-SVG-thumbnail': 'thumbnail',
			'titleblacklist-custom-thumbnail': 'thumbnail',
		 	'titleblacklist-custom-double-apostrophe': 'double-apostrophe'
		};
		if ( result && result.error && result.error.code ) {
			if ( titleErrorMap[code] ) {
				_this.recoverFromError( _this.titleId, gM( 'mwe-upwiz-error-title-' + titleErrorMap[code] ) );
				return;
			} else {
				statusKey = 'api-error-' + code;
				if ( result.error.info ) {
					statusLine = gM( statusKey, result.error.info );
				} else {
					statusLine = gM( statusKey, '[no error info]' );
				}
			}
		}
		this.showError( code, statusLine );
	},

	setStatus: function( s ) {
		this.div.find( '.mwe-upwiz-file-status-line' ).html( s ).show();
	},

	showIndicator: function( statusStr ) {
		this.div.find( '.mwe-upwiz-file-indicator' )
			.show()
			.removeClass( 'mwe-upwiz-status-progress mwe-upwiz-status-error mwe-upwiz-status-uploaded' )
			.addClass( 'mwe-upwiz-status-' + statusStr );
	},

	dateInputCount: 0,

	/**
	 * Apply some special cleanups for titles before adding to model. These cleanups are not reflected in what the user sees in the title input field.
	 * For example, we remove an extension in the title if it matches the extension we're going to add anyway. (bug #30676)
	 * @param {String} title in human-readable form, e.g. "Foo bar", rather than "File:Foo_bar.jpg"
	 * @return {String} cleaned title with prefix and extension, stringified.
	 */
	setCleanTitle: function( s ) {
		var ext = this.upload.title.getExtension();
		var re = new RegExp( '\\.' + this.upload.title.getExtension() + '$', 'i' );
		var cleaned = $j.trim( s.replace( re, '' ) );
		this.upload.title = new mw.Title( cleaned + '.' + ext, fileNsId );
		return this.upload.title;
	}

};

}) ( window.mediaWiki, jQuery );
