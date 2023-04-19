import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function generateConsoleMessage ({ url, port }) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const resolve = (p) => path.resolve(__dirname, p)
    const taxonPagesMark = 
      fs.readFileSync(resolve('./taxonPagesMark.txt'), 'utf-8')
    
    console.log(taxonPagesMark)
    console.log('----------------------------------------------------------')
    console.log('Development server running at: ', `${url}:${port}`)

}