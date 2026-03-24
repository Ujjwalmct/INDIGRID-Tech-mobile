/*
 * Licensed Materials - Property of IBM
 *
 * 5724-U18, 5737-M66
 *
 * (C) Copyright IBM Corp. 2024 All Rights Reserved
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with
 * IBM Corp.
 */

import toDisplayableValue from "./toDisplayableValue";
import manageMissingBase from "./manageMissingBase";
import LocaleConstants from "../../constants/LocaleConstants";

/**
 * @description
 * @param {Number} value
 * @param {Number} maxfraction
 * @param {String} locale - User locale
 * @returns {Number} Number of digits on the right side of the decimal point.
 */
const limitToMaxFraction = (value, maxfraction, locale = LocaleConstants.EN_US) => {

    if(value === null || value === '')
			return null;
		value = value.toString();
		value = manageMissingBase(value, '.')
		const fraction = value.split('.')[1];			
		let fractionSize = -1;
		if(fraction){
			fractionSize = fraction.length;
			if(fractionSize > maxfraction){
				let round = 1;

				if(parseInt(fraction[maxfraction]) <= 5){
					value = value.slice(0, -(fractionSize - maxfraction)); //non rounding case does not manage higer trucate decimal
					round = -1;
				}
				let options = {'places': maxfraction, 'round': round};
				return toDisplayableValue(value.toString(), options, locale);
			}
		
		}
	return toDisplayableValue(value.toString(), {'round': -1}, locale);
};

export default limitToMaxFraction;