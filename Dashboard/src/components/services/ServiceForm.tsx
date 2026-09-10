// components/services/ServiceForm.jsx
import {
  Box, Button, FormControl, FormLabel, Input, Textarea,
  Select, Grid, GridItem, VStack, HStack, Tag, TagLabel, TagCloseButton
} from '@chakra-ui/react';

const ServiceForm = () => {
  return (
    <Box p="6">
      <VStack spacing="6">
        <Grid templateColumns="repeat(2, 1fr)" gap="6" w="100%">
          <GridItem>
            <FormControl>
              <FormLabel>Tên dịch vụ</FormLabel>
              <Input />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>Loại dịch vụ</FormLabel>
              <Select>
                <option value="food">Ẩm thực</option>
                <option value="accommodation">Lưu trú</option>
                <option value="transport">Vận chuyển</option>
                <option value="tour">Tour du lịch</option>
                <option value="attraction">Điểm tham quan</option>
              </Select>
            </FormControl>
          </GridItem>
        </Grid>
        
        <FormControl>
          <FormLabel>Mô tả</FormLabel>
          <Textarea rows={4} />
        </FormControl>
        
        <Grid templateColumns="repeat(2, 1fr)" gap="6" w="100%">
          <GridItem>
            <FormControl>
              <FormLabel>Giá từ</FormLabel>
              <Input type="number" />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>Giá đến</FormLabel>
              <Input type="number" />
            </FormControl>
          </GridItem>
        </Grid>
        
        <HStack spacing="2" wrap="wrap">
          <Button colorScheme="blue">Lưu dịch vụ</Button>
          <Button variant="outline">Hủy</Button>
        </HStack>
      </VStack>
    </Box>
  );
};