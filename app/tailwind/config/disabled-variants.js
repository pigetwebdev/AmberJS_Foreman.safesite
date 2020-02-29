export default function() {
    return function({ addVariant }) {
        addVariant('disabled', ({ modifySelectors, separator }) => {
            modifySelectors(({ className }) => {
                return `.disabled${separator}${className}:disabled`
            })
        })
    }
}
