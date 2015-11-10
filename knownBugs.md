KNOWN* BUGS:
Want to test your QA knowledge? Check how many you could find!

ADMIN

#. Leaving the password blank grants access to any account
#. The credentials are in plaintext in the cookie, easily hackable
#. Oversized images display poorly on product edit screen (like Vine Leaf)
#. Normal pages do not reflect login state
#. Images page show the "Users" tab as active
#. A user with no username can be created, but cannot sign in or have their password changed
#. Cannot remove products, images, or users
#. The failed login page has a dead link ("Learn More")
#. Changing product information does not update the Spotlight widget
#. All users are admins
#. Can upload a blank jpg
#. No photo name is required, screwing up the dropdown when you edit products
#. Price can be non-numeric, and it will go all the way through
#. Failed uploads create broken images
#. Multiple accounts with the same name can be created

PURCHASE FUNNEL
#. Quantity input allows negative numbers, for a negative subtotal (and a refund?)
#. Quantity input allows letters
#. American Express cards are not validated correctly; they are validated like Visa cards
#. 14 and 15-digit Visa cards are accepted despite being not valid
#. When no expiration date is entered, the message reads "Card is expired", not "No expiration date"
#. Credit card should not be a number control
#. Probably date shouldn't either
#. No hinting about state abbreviation vs spelled out state
#. CCV codes can be negative
#. No max quantity
#. Fractional quantities are accepted

MISC:
#. The copyright date is wrong
#. The login is the most obvious call to action on every page
#. The copyright is doubled on the success page
#. Terrerium is misspelled.
#. The page is pretty boring

(*and by "known" I mean "intentional")