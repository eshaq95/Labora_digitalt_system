/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "(pages-dir-node)/./lib/prisma.ts":
/*!***********************!*\
  !*** ./lib/prisma.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n// lib/prisma.ts\n// Import PrismaClient from the generated Prisma client package.\n\n// Use a global variable to store the PrismaClient instance.\n// This prevents creating multiple instances during development with hot reloading.\nconst globalForPrisma = globalThis;\n// Create a single PrismaClient instance or reuse the existing one.\n// In production, always create a new instance.\n// In development, reuse the instance stored in the global object.\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\n// In development, assign the PrismaClient instance to the global object.\n// This avoids exhausting database connections due to repeated instantiation.\nif (true) globalForPrisma.prisma = prisma;\n// Export the PrismaClient instance for use throughout the app.\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (prisma);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL2xpYi9wcmlzbWEudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBLGdCQUFnQjtBQUNoQixnRUFBZ0U7QUFDbkI7QUFFN0MsNERBQTREO0FBQzVELG1GQUFtRjtBQUNuRixNQUFNQyxrQkFBa0JDO0FBRXhCLG1FQUFtRTtBQUNuRSwrQ0FBK0M7QUFDL0Msa0VBQWtFO0FBQzNELE1BQU1DLFNBQVNGLGdCQUFnQkUsTUFBTSxJQUFJLElBQUlILHdEQUFZQSxHQUFFO0FBRWxFLHlFQUF5RTtBQUN6RSw2RUFBNkU7QUFDN0UsSUFBSUksSUFBcUMsRUFBRUgsZ0JBQWdCRSxNQUFNLEdBQUdBO0FBRXBFLCtEQUErRDtBQUMvRCxpRUFBZUEsTUFBTUEsRUFBQSIsInNvdXJjZXMiOlsiL1VzZXJzL2VzaGFxcmFobWFuaS9EZXNrdG9wL1RyYWluZWUvTGFib3JhLURpZ2l0L2xpYi9wcmlzbWEudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gbGliL3ByaXNtYS50c1xuLy8gSW1wb3J0IFByaXNtYUNsaWVudCBmcm9tIHRoZSBnZW5lcmF0ZWQgUHJpc21hIGNsaWVudCBwYWNrYWdlLlxuaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnXG5cbi8vIFVzZSBhIGdsb2JhbCB2YXJpYWJsZSB0byBzdG9yZSB0aGUgUHJpc21hQ2xpZW50IGluc3RhbmNlLlxuLy8gVGhpcyBwcmV2ZW50cyBjcmVhdGluZyBtdWx0aXBsZSBpbnN0YW5jZXMgZHVyaW5nIGRldmVsb3BtZW50IHdpdGggaG90IHJlbG9hZGluZy5cbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7IHByaXNtYT86IFByaXNtYUNsaWVudCB9XG5cbi8vIENyZWF0ZSBhIHNpbmdsZSBQcmlzbWFDbGllbnQgaW5zdGFuY2Ugb3IgcmV1c2UgdGhlIGV4aXN0aW5nIG9uZS5cbi8vIEluIHByb2R1Y3Rpb24sIGFsd2F5cyBjcmVhdGUgYSBuZXcgaW5zdGFuY2UuXG4vLyBJbiBkZXZlbG9wbWVudCwgcmV1c2UgdGhlIGluc3RhbmNlIHN0b3JlZCBpbiB0aGUgZ2xvYmFsIG9iamVjdC5cbmV4cG9ydCBjb25zdCBwcmlzbWEgPSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID8/IG5ldyBQcmlzbWFDbGllbnQoKVxuXG4vLyBJbiBkZXZlbG9wbWVudCwgYXNzaWduIHRoZSBQcmlzbWFDbGllbnQgaW5zdGFuY2UgdG8gdGhlIGdsb2JhbCBvYmplY3QuXG4vLyBUaGlzIGF2b2lkcyBleGhhdXN0aW5nIGRhdGFiYXNlIGNvbm5lY3Rpb25zIGR1ZSB0byByZXBlYXRlZCBpbnN0YW50aWF0aW9uLlxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPSBwcmlzbWFcblxuLy8gRXhwb3J0IHRoZSBQcmlzbWFDbGllbnQgaW5zdGFuY2UgZm9yIHVzZSB0aHJvdWdob3V0IHRoZSBhcHAuXG5leHBvcnQgZGVmYXVsdCBwcmlzbWFcbiJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwicHJpc21hIiwicHJvY2VzcyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(pages-dir-node)/./lib/prisma.ts\n");

/***/ }),

/***/ "(pages-dir-node)/./pages/_app.tsx":
/*!************************!*\
  !*** ./pages/_app.tsx ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DELETE: () => (/* binding */ DELETE),\n/* harmony export */   PATCH: () => (/* binding */ PATCH),\n/* harmony export */   \"default\": () => (/* binding */ MyApp),\n/* harmony export */   runtime: () => (/* binding */ runtime)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/styles/globals.css */ \"(pages-dir-node)/./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/prisma */ \"(pages-dir-node)/./lib/prisma.ts\");\n// Import global styles\n\n\n// Specify that this route should run on Node.js runtime.\nconst runtime = 'nodejs';\n\n/**\n * PATCH handler to update a product's name or stock.\n * - Reads the product ID from params.\n * - Parses the request body for updated fields.\n * - Updates the product in the database.\n * - Returns the updated product or a 404 error if not found.\n */ async function PATCH(req, { params }) {\n    const { id } = params;\n    // Parse request body safely.\n    const body = await req.json().catch(()=>({}));\n    // Prepare update data, only including valid fields.\n    const data = {};\n    if (typeof body.name === 'string') data.name = body.name.trim();\n    if (typeof body.stock === 'number') data.stock = body.stock;\n    try {\n        // Attempt to update the product in the database.\n        const updated = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.product.update({\n            where: {\n                id\n            },\n            data\n        });\n        return Response.json(updated);\n    } catch  {\n        // Return 404 if product not found.\n        return Response.json({\n            error: 'Not found'\n        }, {\n            status: 404\n        });\n    }\n}\n/**\n * DELETE handler to remove a product by ID.\n * - Reads the product ID from params.\n * - Deletes the product from the database.\n * - Returns 204 on success or 404 if not found.\n */ async function DELETE(_, { params }) {\n    const { id } = params;\n    try {\n        await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.product.delete({\n            where: {\n                id\n            }\n        });\n        return new Response(null, {\n            status: 204\n        });\n    } catch  {\n        return Response.json({\n            error: 'Not found'\n        }, {\n            status: 404\n        });\n    }\n}\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n        ...pageProps\n    }, void 0, false, {\n        fileName: \"/Users/eshaqrahmani/Desktop/Trainee/Labora-Digit/pages/_app.tsx\",\n        lineNumber: 58,\n        columnNumber: 10\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHBhZ2VzLWRpci1ub2RlKS8uL3BhZ2VzL19hcHAudHN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLHVCQUF1Qjs7QUFDTTtBQUc3Qix5REFBeUQ7QUFDbEQsTUFBTUEsVUFBVSxTQUFRO0FBSU07QUFLckM7Ozs7OztDQU1DLEdBQ00sZUFBZUUsTUFBTUMsR0FBZ0IsRUFBRSxFQUFFQyxNQUFNLEVBQU87SUFDM0QsTUFBTSxFQUFFQyxFQUFFLEVBQUUsR0FBR0Q7SUFDZiw2QkFBNkI7SUFDN0IsTUFBTUUsT0FBTyxNQUFNSCxJQUFJSSxJQUFJLEdBQUdDLEtBQUssQ0FBQyxJQUFPLEVBQUM7SUFDNUMsb0RBQW9EO0lBQ3BELE1BQU1DLE9BQTBDLENBQUM7SUFDakQsSUFBSSxPQUFPSCxLQUFLSSxJQUFJLEtBQUssVUFBVUQsS0FBS0MsSUFBSSxHQUFHSixLQUFLSSxJQUFJLENBQUNDLElBQUk7SUFDN0QsSUFBSSxPQUFPTCxLQUFLTSxLQUFLLEtBQUssVUFBVUgsS0FBS0csS0FBSyxHQUFHTixLQUFLTSxLQUFLO0lBRTNELElBQUk7UUFDRixpREFBaUQ7UUFDakQsTUFBTUMsVUFBVSxNQUFNWiwrQ0FBTUEsQ0FBQ2EsT0FBTyxDQUFDQyxNQUFNLENBQUM7WUFBRUMsT0FBTztnQkFBRVg7WUFBRztZQUFHSTtRQUFLO1FBQ2xFLE9BQU9RLFNBQVNWLElBQUksQ0FBQ007SUFDdkIsRUFBRSxPQUFNO1FBQ04sbUNBQW1DO1FBQ25DLE9BQU9JLFNBQVNWLElBQUksQ0FBQztZQUFFVyxPQUFPO1FBQVksR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDN0Q7QUFDRjtBQUVBOzs7OztDQUtDLEdBQ00sZUFBZUMsT0FBT0MsQ0FBYyxFQUFFLEVBQUVqQixNQUFNLEVBQU87SUFDMUQsTUFBTSxFQUFFQyxFQUFFLEVBQUUsR0FBR0Q7SUFDZixJQUFJO1FBQ0YsTUFBTUgsK0NBQU1BLENBQUNhLE9BQU8sQ0FBQ1EsTUFBTSxDQUFDO1lBQUVOLE9BQU87Z0JBQUVYO1lBQUc7UUFBRTtRQUM1QyxPQUFPLElBQUlZLFNBQVMsTUFBTTtZQUFFRSxRQUFRO1FBQUk7SUFDMUMsRUFBRSxPQUFNO1FBQ04sT0FBT0YsU0FBU1YsSUFBSSxDQUFDO1lBQUVXLE9BQU87UUFBWSxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUM3RDtBQUNGO0FBRWUsU0FBU0ksTUFBTSxFQUFFQyxTQUFTLEVBQUVDLFNBQVMsRUFBWTtJQUM5RCxxQkFBTyw4REFBQ0Q7UUFBVyxHQUFHQyxTQUFTOzs7Ozs7QUFDakMiLCJzb3VyY2VzIjpbIi9Vc2Vycy9lc2hhcXJhaG1hbmkvRGVza3RvcC9UcmFpbmVlL0xhYm9yYS1EaWdpdC9wYWdlcy9fYXBwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBJbXBvcnQgZ2xvYmFsIHN0eWxlc1xuaW1wb3J0ICdAL3N0eWxlcy9nbG9iYWxzLmNzcydcbmltcG9ydCB0eXBlIHsgQXBwUHJvcHMgfSBmcm9tICduZXh0L2FwcCdcblxuLy8gU3BlY2lmeSB0aGF0IHRoaXMgcm91dGUgc2hvdWxkIHJ1biBvbiBOb2RlLmpzIHJ1bnRpbWUuXG5leHBvcnQgY29uc3QgcnVudGltZSA9ICdub2RlanMnXG5cbi8vIEltcG9ydCBOZXh0LmpzIHJlcXVlc3QgdHlwZSBhbmQgUHJpc21hIGNsaWVudCBpbnN0YW5jZS5cbmltcG9ydCB7IE5leHRSZXF1ZXN0IH0gZnJvbSAnbmV4dC9zZXJ2ZXInXG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tICdAL2xpYi9wcmlzbWEnXG5cbi8vIERlZmluZSB0aGUgY29udGV4dCB0eXBlIGZvciByb3V0ZSBoYW5kbGVycywgZXh0cmFjdGluZyB0aGUgcHJvZHVjdCBJRCBmcm9tIHBhcmFtcy5cbnR5cGUgQ3R4ID0geyBwYXJhbXM6IHsgaWQ6IHN0cmluZyB9IH1cblxuLyoqXG4gKiBQQVRDSCBoYW5kbGVyIHRvIHVwZGF0ZSBhIHByb2R1Y3QncyBuYW1lIG9yIHN0b2NrLlxuICogLSBSZWFkcyB0aGUgcHJvZHVjdCBJRCBmcm9tIHBhcmFtcy5cbiAqIC0gUGFyc2VzIHRoZSByZXF1ZXN0IGJvZHkgZm9yIHVwZGF0ZWQgZmllbGRzLlxuICogLSBVcGRhdGVzIHRoZSBwcm9kdWN0IGluIHRoZSBkYXRhYmFzZS5cbiAqIC0gUmV0dXJucyB0aGUgdXBkYXRlZCBwcm9kdWN0IG9yIGEgNDA0IGVycm9yIGlmIG5vdCBmb3VuZC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBBVENIKHJlcTogTmV4dFJlcXVlc3QsIHsgcGFyYW1zIH06IEN0eCkge1xuICBjb25zdCB7IGlkIH0gPSBwYXJhbXNcbiAgLy8gUGFyc2UgcmVxdWVzdCBib2R5IHNhZmVseS5cbiAgY29uc3QgYm9keSA9IGF3YWl0IHJlcS5qc29uKCkuY2F0Y2goKCkgPT4gKHt9KSlcbiAgLy8gUHJlcGFyZSB1cGRhdGUgZGF0YSwgb25seSBpbmNsdWRpbmcgdmFsaWQgZmllbGRzLlxuICBjb25zdCBkYXRhOiB7IG5hbWU/OiBzdHJpbmc7IHN0b2NrPzogbnVtYmVyIH0gPSB7fVxuICBpZiAodHlwZW9mIGJvZHkubmFtZSA9PT0gJ3N0cmluZycpIGRhdGEubmFtZSA9IGJvZHkubmFtZS50cmltKClcbiAgaWYgKHR5cGVvZiBib2R5LnN0b2NrID09PSAnbnVtYmVyJykgZGF0YS5zdG9jayA9IGJvZHkuc3RvY2tcblxuICB0cnkge1xuICAgIC8vIEF0dGVtcHQgdG8gdXBkYXRlIHRoZSBwcm9kdWN0IGluIHRoZSBkYXRhYmFzZS5cbiAgICBjb25zdCB1cGRhdGVkID0gYXdhaXQgcHJpc21hLnByb2R1Y3QudXBkYXRlKHsgd2hlcmU6IHsgaWQgfSwgZGF0YSB9KVxuICAgIHJldHVybiBSZXNwb25zZS5qc29uKHVwZGF0ZWQpXG4gIH0gY2F0Y2gge1xuICAgIC8vIFJldHVybiA0MDQgaWYgcHJvZHVjdCBub3QgZm91bmQuXG4gICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ05vdCBmb3VuZCcgfSwgeyBzdGF0dXM6IDQwNCB9KVxuICB9XG59XG5cbi8qKlxuICogREVMRVRFIGhhbmRsZXIgdG8gcmVtb3ZlIGEgcHJvZHVjdCBieSBJRC5cbiAqIC0gUmVhZHMgdGhlIHByb2R1Y3QgSUQgZnJvbSBwYXJhbXMuXG4gKiAtIERlbGV0ZXMgdGhlIHByb2R1Y3QgZnJvbSB0aGUgZGF0YWJhc2UuXG4gKiAtIFJldHVybnMgMjA0IG9uIHN1Y2Nlc3Mgb3IgNDA0IGlmIG5vdCBmb3VuZC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIERFTEVURShfOiBOZXh0UmVxdWVzdCwgeyBwYXJhbXMgfTogQ3R4KSB7XG4gIGNvbnN0IHsgaWQgfSA9IHBhcmFtc1xuICB0cnkge1xuICAgIGF3YWl0IHByaXNtYS5wcm9kdWN0LmRlbGV0ZSh7IHdoZXJlOiB7IGlkIH0gfSlcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHsgc3RhdHVzOiAyMDQgfSlcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ05vdCBmb3VuZCcgfSwgeyBzdGF0dXM6IDQwNCB9KVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIE15QXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfTogQXBwUHJvcHMpIHtcbiAgcmV0dXJuIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbn1cbiJdLCJuYW1lcyI6WyJydW50aW1lIiwicHJpc21hIiwiUEFUQ0giLCJyZXEiLCJwYXJhbXMiLCJpZCIsImJvZHkiLCJqc29uIiwiY2F0Y2giLCJkYXRhIiwibmFtZSIsInRyaW0iLCJzdG9jayIsInVwZGF0ZWQiLCJwcm9kdWN0IiwidXBkYXRlIiwid2hlcmUiLCJSZXNwb25zZSIsImVycm9yIiwic3RhdHVzIiwiREVMRVRFIiwiXyIsImRlbGV0ZSIsIk15QXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(pages-dir-node)/./pages/_app.tsx\n");

/***/ }),

/***/ "(pages-dir-node)/./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@prisma/client");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(pages-dir-node)/./pages/_app.tsx"));
module.exports = __webpack_exports__;

})();