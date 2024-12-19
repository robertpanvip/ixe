export default function classNames(...args: (string | boolean | void)[]) {
    return args.filter(Boolean).join(' ')
}