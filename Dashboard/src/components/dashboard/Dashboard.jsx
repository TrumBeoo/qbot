// components/dashboard/Dashboard.jsx
import {
  Box, Grid, GridItem, Stat, StatLabel, StatNumber,
  StatHelpText, StatArrow, Card, CardBody
} from '@chakra-ui/react';

const Dashboard = () => {
  return (
    <Box p="6">
      <Grid templateColumns="repeat(4, 1fr)" gap="6" mb="8">
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Tổng dịch vụ</StatLabel>
                <StatNumber>23</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  23.36%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Lượt quan tâm</StatLabel>
                <StatNumber>1,234</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  9.05%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
};