import {threeDotStringRepresentation} from './stringUtil'


test('Correct three dot representation when length is far below the boundary', async () => {
    const result = threeDotStringRepresentation('12345')
    expect(result).toEqual('12345');
})

test('Correct three dot representation when length is much more than the boundary', async () => {
    const result = threeDotStringRepresentation('a fairly long string')
    expect(result).toEqual('a fai...tring');
})

test('Correct three dot representation when length is right under the boundary', async () => {
    const result = threeDotStringRepresentation('1234567899')
    expect(result).toEqual('1234567899');
})

test('Correct three dot representation when length is right above the boundary', async () => {
    const result = threeDotStringRepresentation('12345678999')
    expect(result).toEqual('12345...78999');
})